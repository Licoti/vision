#!/usr/bin/env node
/**
 * Hook PreToolUse — répond automatiquement aux questions de clarification.
 *
 * À placer dans <projet>/.claude/hooks/answer-recommended.mjs
 *
 * Reçoit l'événement JSON sur stdin, et pour AskUserQuestion :
 *   - choisit l'option marquée "recommandé" (à défaut, la première)
 *   - trace la question, toutes les options et le choix dans .ticket-logs/answers.jsonl
 *   - renvoie permissionDecision "allow" + updatedInput { questions, answers }
 *
 * Pour tout autre outil : exit 0 sans sortie → le flux de permission normal s'applique.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

// Garde-fou : en session interactive normale, ce hook ne fait rien et tu réponds
// toi-même. Seul le runner pose TICKET_RUNNER=1 dans l'environnement.
if (process.env.TICKET_RUNNER !== "1") process.exit(0);

const RECO = /recommand|recommend|conseill|préconis|preconis|par défaut|default/i;

const raw = await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (data += c));
  process.stdin.on("end", () => resolve(data));
});

let event;
try {
  event = JSON.parse(raw);
} catch {
  process.exit(0); // entrée illisible : on ne décide rien
}

if (event.tool_name !== "AskUserQuestion") process.exit(0);

const questions = event.tool_input?.questions ?? [];
const answers = {};
const trace = [];

for (const q of questions) {
  const options = q.options ?? [];
  if (!options.length) continue;

  const hits = options.filter(
    (o) => RECO.test(o.label ?? "") || RECO.test(o.description ?? "")
  );
  const source = hits.length ? "recommandé" : "1re option (aucun 'recommandé' détecté)";
  const chosen = q.multiSelect
    ? (hits.length ? hits : [options[0]]).map((o) => o.label)
    : (hits[0] ?? options[0]).label;

  answers[q.question] = chosen;
  trace.push({ header: q.header, question: q.question, options, chosen, source });
}

// Trace lisible par le runner (et par toi)
try {
  const dir = path.join(process.env.CLAUDE_PROJECT_DIR ?? event.cwd ?? ".", ".ticket-logs");
  mkdirSync(dir, { recursive: true });
  appendFileSync(
    path.join(dir, "answers.jsonl"),
    JSON.stringify({
      ts: new Date().toISOString(),
      session_id: event.session_id,
      permission_mode: event.permission_mode,
      questions: trace,
    }) + "\n"
  );
} catch {
  // ne jamais faire échouer le hook à cause du log
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: "Réponse automatique du runner (option recommandée)",
      updatedInput: { questions, answers },
    },
  })
);
