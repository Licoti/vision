/**
 * La carte de la personne courante, en pied de barre latérale (T7.5).
 *
 * **C'est le second des deux blocs que T1.6 avait écartés**, et le dernier : le
 * premier, l'entrée « Administration », est arrivé le 21/08/2026 avec l'écran
 * qui lui donnait un sens. Celui-ci n'attendait ni droit ni écran — il
 * attendait un ticket.
 *
 * **Elle reçoit, elle ne lit pas.** C'est la règle de `MainNav` : la coquille
 * est le composant serveur qui lit la session, et ce qu'elle en tire descend en
 * props. Les trois valeurs sont donc celles du contexte, **telles quelles** —
 * aucune n'est recalculée, aucune n'ouvre une requête. Le métier de la personne
 * n'y figure pas pour cette raison : le contexte n'en porte que l'identifiant
 * (`SessionPerson.jobId`), et l'écrire demanderait de lire le référentiel.
 *
 * **Elle ne bascule pas d'identité, et ce n'est pas un oubli.** `/dev/session`
 * reste le seul endroit où l'on change de personne courante ; le SSO est sorti
 * de C7 le 27/08/2026, et donner ce rôle à la coquille ferait d'elle un outil
 * de développement. La carte est donc du texte : ni lien, ni formulaire, ni
 * sélecteur.
 *
 * **Sans session, elle se rend quand même.** La coquille enveloppe aussi les
 * écrans qui n'en ont pas, et une carte qui disparaîtrait laisserait la barre
 * latérale se terminer sans qu'on sache pourquoi. L'absence se dit (règle 5).
 *
 * **Aucun fond, aucun filet, et c'est une mesure — pas un oubli.** La maquette
 * pose la carte sur un voile blanc à 8 % ; le dépôt n'a pas ce jeton. Ses cinq
 * surfaces à opacité (`tokens.css` §2.5) sont des voiles **noirs**, qui sur ce
 * fond assombrissent au lieu d'éclaircir et mesurent **1,03:1**. Le seul fond
 * perceptible sans inventer de jeton serait `surface-primary-normal`
 * (**1,44:1**), et c'est celui de l'entrée de navigation courante : la carte se
 * lirait comme une entrée sélectionnée. Un fond mesuré à 1,05:1 a déjà été
 * retiré pour cette raison le 29/08/2026, et les interdits communs de C7
 * refusent qu'un neuvième manque du design system s'invente. Le pied se détache
 * donc par l'espace — `mt-auto`, puis le `gap-8` de la barre —, comme le logo se
 * détache déjà de la navigation.
 *
 * **Les deux couples de couleurs sont ceux que la barre sert déjà**, et ils sont
 * neufs par la position, donc mesurés : `content-neutral-pale` sur
 * `surface-primary-base`, **13,65:1** ; `surface-primary-soft` — le jeton des
 * entrées non courantes — sur le même fond, **7,82:1**.
 *
 * **Aucun titre**, et c'est délibéré : un `h2` ici entrerait dans la hiérarchie
 * de titres de **chaque** écran du produit, que l'audit d'accessibilité vérifie
 * (`docs/06` §11). Le contexte est donné à la voix par une mention hors écran,
 * qui ne coûte pas un niveau de titre.
 */

import type { DomainRole } from "@/lib/auth/session";

/**
 * Les deux rôles, en toutes lettres et en tête de phrase.
 *
 * `/dev/session` porte les mêmes mots **en minuscules** : il les glisse dans une
 * phrase, la carte les pose seuls. Ce sont deux libellés, pas une duplication à
 * replier — et le lieu où ils devraient vivre, `lib/format.ts`, est hors du
 * périmètre de ce ticket. Le point ouvert d'`ETAT.md` en compte un quatrième.
 */
const ROLE_LABEL: Record<DomainRole, string> = {
  domain_manager: "Responsable de domaine",
  member: "Membre",
};

/** Ce que la coquille tire du contexte, et rien de plus. */
export type CurrentPersonView = {
  readonly fullName: string;
  readonly role: DomainRole;
  /** Le domaine courant — l'entreprise accompagnée, jamais le centre. */
  readonly domainName: string;
};

export function CurrentPerson({
  person,
}: {
  person: CurrentPersonView | null;
}) {
  return (
    /* `px-1.5` : l'alignement du logo, qui porte le même retrait. */
    <div className="mt-auto flex flex-col gap-0.5 px-1.5">
      {person ? (
        <>
          <p className="truncate text-sm font-semibold text-content-neutral-pale">
            {/* Deux lignes sans titre ne disent pas à la voix de qui elles
                parlent : la mention le dit, et elle ne coûte pas un `h2`. */}
            <span className="sr-only">Personne courante : </span>
            {person.fullName}
          </p>
          <p className="text-xs text-surface-primary-soft">
            {ROLE_LABEL[person.role]} · {person.domainName}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-content-neutral-pale">
            Aucune personne courante
          </p>
          <p className="text-xs text-surface-primary-soft">
            La base ne porte pas de domaine actif, ou aucune de ses personnes ne
            peut se connecter.
          </p>
        </>
      )}
    </div>
  );
}
