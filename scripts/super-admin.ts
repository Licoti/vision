/**
 * Le premier super administrateur — le seul geste que rien d'autre ne pose.
 *
 *   npm run auth:super-admin -- --email=… --nom="…"
 *
 * **Pourquoi un script et pas un écran.** L'interdit de T9.1 renvoie la
 * première ligne de `super_admins` à T9.2 ; T9.4 ouvrira l'écran des domaines,
 * mais il faudra un super administrateur pour l'atteindre. C'est l'amorçage
 * d'un droit qui, par construction, ne peut pas s'accorder depuis l'intérieur
 * du produit — comme une première clé se pose de l'extérieur de la serrure.
 *
 * **Pourquoi pas une variable d'environnement.** L'arbitrage (4) de
 * `tickets-C9.md` a écarté la liste d'e-mails en configuration, et pour deux
 * raisons nommées : elle ne laisse aucune trace, et elle demande un
 * redéploiement. Une ligne en base se lit, s'archive, et archiver **est** le
 * geste qui retire le droit (`findSuperAdminByEmail` ne rend pas une ligne
 * archivée).
 *
 * **Il passe par `lib/db/scoped.ts`, comme `scripts/seed.ts`.** Un script qui
 * ouvrirait sa propre connexion pour éviter la règle 1 contournerait la règle,
 * pas la contrainte : l'écriture vit donc dans le bloc « Ce qui vit avant le
 * domaine », qui est le lieu nommé de ce que le scope ne peut pas couvrir.
 *
 * **Aucun identifiant de fournisseur n'est saisi ici.** `identity_provider` et
 * `external_id` restent nuls : le rapprochement de la règle d'entrée 2 se fait
 * sur l'e-mail **vérifié par le fournisseur**, et fabriquer un identifiant
 * serait inventer (même raisonnement que `scripts/seed.ts` sur `persons`).
 */

import { asSuperAdmin, withoutAnySession } from "../lib/db/scoped";

/* L'amorçage écrit hors de toute session — l'échappée nommée de T9.3. */
const outsideAnySession = asSuperAdmin(
  withoutAnySession("amorçage du premier droit"),
);

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

async function main(): Promise<void> {
  const email = argument("email")?.trim();
  const fullName = argument("nom")?.trim();

  if (!email || !fullName) {
    throw new Error(
      'Usage : npm run auth:super-admin -- --email=… --nom="…"\n' +
        "L'e-mail est celui que le fournisseur vérifiera : c'est la clé de la " +
        "règle d'entrée 2, la seule exception à l'arbitrage (2) de " +
        "`tickets-C9.md`.",
    );
  }

  const { row, created } = await outsideAnySession.upsertSuperAdmin({
    email,
    fullName,
  });

  console.log(
    created
      ? `Super administrateur créé : ${fullName} <${email}> — ${row.id}`
      : `Super administrateur mis à jour : ${fullName} <${email}> — ${row.id}`,
  );

  /* **La liste se lit depuis le grant depuis T9.4**, et non plus depuis
     `superAdmin` : elle dit qui détient le droit, et elle ne tourne pas pendant
     une connexion. Le script tient déjà l'autorité qui lui a servi à écrire — le
     déplacement lui coûte un mot, et c'est la mesure du bon endroit. */
  const all = await outsideAnySession.listSuperAdmins();
  console.log(
    `\n${all.length} super administrateur(s) en exercice : ` +
      all.map((admin) => admin.email).join(", "),
  );
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error("\nGeste interrompu.");
    console.error(error);
    process.exit(1);
  },
);
