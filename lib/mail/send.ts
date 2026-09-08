/**
 * L'envoi d'un courriel — **une invitation, une fois, et rien d'autre** (T11.3).
 *
 * **Un `fetch` vers une API HTTP, et zéro dépendance neuve** (arbitrage (3) de
 * `tickets-C11.md`). SMTP demandait un paquet et une connexion longue, mal
 * adaptée au serverless ; Microsoft Graph demandait des autorisations
 * d'application — *« longues à obtenir »*, la raison exacte qui a tenu l'import
 * d'annuaire hors de C9. Le dépôt reste à six paquets de production.
 *
 * **Rien ici n'annule une invitation.** Ce module ne lève jamais : il rend
 * `true` si le message est parti, `false` sinon. Un envoi raté laisse
 * `sent_at` nul, le lien affiché et l'invitation valide — la panne d'un
 * transporteur n'a pas à défaire un geste déjà écrit en base. C'est la mise en
 * défaut que la fiche prescrit : *l'échec d'envoi transformé en levée doit faire
 * tomber la mesure 2 seule*.
 *
 * **Aucune relance, aucun réessai, aucune file** : `docs/03` §8 n'est pas
 * amendé, et l'exclusion de `docs/05` §4 ne l'est que pour *une* invitation qui
 * part *une* fois. Réinviter est un geste humain qui révoque d'abord.
 *
 * **Le corps est du texte, jamais du HTML.** Un message mis en page demanderait
 * des couleurs et des tailles écrites à la main dans une balise `<style>` — ce
 * que la règle 2 interdit, et qu'aucun jeton du design system ne couvre (les
 * interdits communs de C11 refusent un neuvième jeton inventé). Le texte n'a
 * pas ce problème et se lit partout.
 *
 * **Ni base, ni Next, ni React** : ce module reçoit ce qu'il doit écrire et
 * rend un booléen. Ce qui se passe ensuite en base est l'affaire de l'appelant.
 */

import { formatEventDay } from "../format";
import { PERSON_ROLE_LABEL, PERSON_ROLE_NOTE } from "../forms/person";
import type { InvitationRoleValue } from "../forms/invitation";

/** Le point d'entrée de l'API, écrit **une seule fois**. */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Dix secondes, et la borne n'est pas décorative.
 *
 * Un `fetch` sans délai d'attente tient l'action serveur ouverte aussi
 * longtemps que le transporteur se tait : l'invitation serait écrite en base et
 * le panneau n'afficherait jamais le lien qui la rend utilisable. Le pire des
 * deux états, pour un envoi dont l'échec est déjà sans conséquence.
 */
const TIMEOUT_MS = 10_000;

/**
 * L'envoi est-il **raccordé à cet environnement** ? — calque exact
 * d'`isProviderConnected` (`lib/auth/oidc.ts`), et pour la même raison.
 *
 * **Les deux valeurs comptent.** Une clé sans expéditeur mènerait jusqu'à
 * l'appel pour le faire échouer chez Resend, c'est-à-dire *après* que le geste
 * a cru pouvoir écrire — le pire des deux moments pour découvrir un réglage
 * manquant, exactement l'argument du fournisseur à demi renseigné.
 *
 * **Lue à l'usage, jamais figée au chargement du module** : un même artefact se
 * déploie sur deux environnements, et le geste doit dire l'état de celui qui le
 * sert. Ce test tombe le jour où la valeur serait capturée au module.
 */
export function isMailConnected(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/** Ce qu'un message d'invitation dit, et **pas un champ de plus**. */
export type InvitationMail = {
  /** L'adresse **copiée** sur l'invitation, jamais celle de la ligne `persons`. */
  to: string;
  domainName: string;
  /** Qui invite : un message sans expéditeur nommé se lit comme un hameçonnage. */
  inviterName: string;
  role: InvitationRoleValue;
  expiresAt: Date;
  link: string;
};

/**
 * Le sujet et le corps, **purs et mesurables** — séparés de l'envoi pour que le
 * test lise ce qui part sans avoir à intercepter quoi que ce soit.
 *
 * **Les mots du rôle ne se recopient pas** : `PERSON_ROLE_LABEL` et
 * `PERSON_ROLE_NOTE` (`lib/forms/person.ts`) disent déjà *ce que le rôle donne*
 * dans le panneau qui invite. Une quatrième écriture aggraverait le point ouvert
 * des trois copies, en attente de T7.9.
 *
 * **La date se rend par `formatEventDay`**, seule règle de fuseau du dépôt : un
 * `expires_at` est un horodatage, et le formater ici en referait la règle.
 */
export function invitationMailBody(mail: InvitationMail): {
  subject: string;
  text: string;
} {
  return {
    subject: `Invitation à rejoindre ${mail.domainName} sur Vision`,
    text: [
      `${mail.inviterName} vous invite à rejoindre ${mail.domainName} sur Vision.`,
      "",
      `Votre rôle : ${PERSON_ROLE_LABEL[mail.role]}.`,
      PERSON_ROLE_NOTE[mail.role],
      "",
      "Pour accepter, ouvrez ce lien et connectez-vous avec votre compte",
      "professionnel :",
      mail.link,
      "",
      `Ce lien est valable jusqu'au ${formatEventDay(mail.expiresAt)}.`,
      "Il ne vous connecte pas à lui seul : c'est votre fournisseur d'identité",
      "qui vérifie qui vous êtes, et cette vérification-là ouvre l'accès.",
    ].join("\n"),
  };
}

/**
 * Envoie l'invitation. **Rend `true` si elle est partie, `false` sinon.**
 *
 * Trois façons de rendre `false`, et aucune ne lève : l'envoi n'est pas
 * raccordé, l'API refuse, le réseau ou le délai d'attente coupe. L'appelant
 * n'a donc qu'une question à poser — *est-ce parti ?* —, et l'invitation ne
 * dépend jamais de la réponse.
 *
 * **L'échec se nomme sur la sortie d'erreur.** Un envoi muet qui ne part pas
 * est un défaut qu'on ne diagnostique plus : la trace dit ce qui a échoué, sans
 * le lien ni la clé — ni l'un ni l'autre n'a sa place dans un journal de
 * serveur.
 */
export async function sendInvitationMail(
  mail: InvitationMail,
): Promise<boolean> {
  if (!isMailConnected()) return false;

  const { subject, text } = invitationMailBody(mail);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        /* **Un seul destinataire.** Une invitation désigne une personne, et une
           copie à qui invite ferait voyager un lien d'accès de plus. */
        to: [mail.to],
        subject,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[mail] L'invitation n'est pas partie : l'API a rendu ${response.status}. ` +
          "L'invitation reste valide et son lien s'affiche dans le panneau.",
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[mail] L'invitation n'est pas partie : " +
        (error instanceof Error ? error.message : String(error)) +
        ". L'invitation reste valide et son lien s'affiche dans le panneau.",
    );
    return false;
  }
}
