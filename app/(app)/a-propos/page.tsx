/**
 * À propos — la note interne, rédigée (D36, T7.8).
 *
 * **La route existait depuis T1.6 et n'avait que son annonce** : un état vide
 * qui disait « la note s'affichera ici ». C'était le seul état vide de Vision
 * qui n'attendait aucune donnée — il attendait du texte, et le texte est ce
 * ticket. La règle 5 n'y est plus en cause : il n'y a plus rien de vide.
 *
 * **Aucune lecture en base, et c'est une exigence, pas une économie.** Cette
 * page ne sait rien du domaine courant, ne prend aucun paramètre et n'est pas
 * `async` : lui donner une requête la rendrait faillible pour un contenu qui ne
 * dépend d'aucune donnée. Elle se rend donc **sans session** — la coquille lit
 * `getSession()` et se replie —, ce qui est aussi ce qui la rend mesurable au
 * `curl` nu.
 *
 * **La date de la section 4 est un littéral.** `new Date()` afficherait
 * toujours « aujourd'hui » sur un texte qui, lui, ne bouge pas : une date
 * calculée mentirait dès la première semaine. Elle se corrige à la main, le
 * jour où le contenu change.
 *
 * **Le vocabulaire de l'interface, pas celui des documents de conception.**
 * L'écran dit **Accompagnement**, comme la navigation depuis le renommage du
 * 02/09/2026, là où `docs/02` §3 dit « Projet » (D35, rouverte par décision
 * humaine). Cette page est la première qui **définit** les mots au lieu de les
 * employer : y définir un mot que la navigation ne sert nulle part aurait posé
 * un troisième vocabulaire. Le code et la base restent en `projects`.
 *
 * **Aucun terme proscrit de `docs/02` §8**, y compris dans les phrases qui les
 * nient : c'est ce qui vaut à la section 3 son « le pilotage du travail reste
 * dans les outils qui le tiennent » plutôt que la formule directe, et son
 * « fichier » là où le mot interdit serait venu tout seul.
 *
 * **Aucun couple de couleurs neuf par la position** (règle 2) : les deux seuls
 * couples employés sont ceux que `SectionHeader` sert **dans la même
 * `Section`** — `content-neutral-darkest` pour les titres et les intitulés,
 * `content-neutral-dark` pour la prose, sur `surface-neutral-pale`, mesuré à
 * 8,12:1 (`components/ui/section.tsx`).
 */

import { Section, SectionHeader } from "@/components/ui/section";
import { Page, PageHeader } from "@/components/ui/page";

export const metadata = {
  title: "À propos — Vision",
};

/**
 * La prose de la note — le patron de `BLOCK_NOTE` (`empty-state.tsx`), écrit
 * une fois pour que quinze paragraphes ne dérivent pas en quinze écritures.
 *
 * **Ce n'est pas `BlockNote`**, dont la doctrine dit « paragraphe d'**absence**
 * dans un bloc déjà rempli par ailleurs » : de la prose n'est pas une absence,
 * et réemployer le composant pour sa classe l'aurait vidé de son critère.
 * Aucun composant de socle neuf n'est créé pour autant — cette page est la
 * seule du dépôt qui porte du texte long (règle 3).
 */
const PROSE = "max-w-160 text-sm leading-175 text-content-neutral-dark";

/** L'intitulé d'un terme du glossaire — le `<dt>` de la section 2. */
const TERM = "text-sm font-semibold text-content-neutral-darkest";

/**
 * Le glossaire : cinq niveaux d'appartenance, puis quatre mots qu'on confond.
 *
 * `docs/02` §2 en compte onze ; la fiche demande « le vocabulaire en quelques
 * lignes », pas le glossaire entier. Les cinq premiers sont la chaîne
 * elle-même — c'est elle qui structure tout le produit. Les quatre suivants
 * sont ceux dont l'ambiguïté coûte quelque chose : l'entité qu'on prend pour
 * une frontière, l'indicateur qu'on croit porté par l'accompagnement, le
 * journal qu'on prend pour une activité, l'approche qu'on confond avec le
 * métier.
 */
const GLOSSARY: readonly { term: string; definition: string }[] = [
  {
    term: "Domaine",
    definition:
      "L'entreprise accompagnée. C'est une frontière étanche : rien de ce qui est saisi dans l'une n'est lisible depuis une autre.",
  },
  {
    term: "Produit",
    definition:
      "L'objet durable que le centre accompagne, rattaché à une entité de l'entreprise. Il vit plus longtemps que les accompagnements qu'il reçoit.",
  },
  {
    term: "Accompagnement",
    definition:
      "Une intervention datée du centre sur un produit : un objectif, une période, une équipe, des approches. Un produit en reçoit plusieurs, l'un après l'autre.",
  },
  {
    term: "Activité",
    definition:
      "Un fait daté de l'accompagnement : un atelier, un audit, une campagne de tests. C'est ce qui remplit la roadmap.",
  },
  {
    term: "Ressource et résultat",
    definition:
      "Ce qu'une activité laisse. Une ressource est un lien vers ce qui est hébergé ailleurs ; un résultat est une synthèse chiffrée, avec sa date et le lien vers l'outil qui l'a produite.",
  },
  {
    term: "Entité",
    definition:
      "Une division de l'entreprise. Elle qualifie les produits et filtre leur liste ; elle ne cloisonne rien — au sein d'un domaine, tout est lisible par tous.",
  },
  {
    term: "Indicateur",
    definition:
      "Une mesure du produit, suivie dans le temps par ses relevés. Un accompagnement peut en adopter un et lui donner une cible ; l'indicateur, lui, reste au produit.",
  },
  {
    term: "Journal",
    definition:
      "La trace de qui a modifié quoi, et quand. Ce n'est pas une activité : l'une est un fait d'accompagnement, l'autre une trace du logiciel.",
  },
  {
    term: "Approche",
    definition:
      "La manière d'accompagner : recherche, design thinking, audit UX. Un accompagnement en déclare plusieurs, une activité au plus une.",
  },
];

/**
 * La thèse, en deux paragraphes (`docs/01` §1-2).
 *
 * **Le texte vit dans des constantes, jamais en nœud JSX**, et c'est le lint du
 * dépôt qui l'impose : `react/no-unescaped-entities` refuse l'apostrophe droite
 * dans le corps d'une balise, et le français en met une par phrase. Passer les
 * phrases en chaînes est aussi ce que font les états vides et les neuf
 * descriptions de l'administration — le texte y est une donnée de l'écran.
 */
const THESIS: readonly string[] = [
  "Vision documente l'accompagnement du centre de compétence design, produit par produit, dans le temps. Le centre intervient sur des produits qui ne lui appartiennent pas, et ce qu'il produit part dans les outils des autres : les livrables dans l'espace partagé, les audits dans leur plateforme, les mesures dans l'analytique, le budget dans l'outil de gestion. Vision est l'endroit qui relie tout cela à un produit et à un moment.",
  "Elle affiche une synthèse et renvoie à la source. Un résultat porte toujours sa date et le lien vers l'outil qui l'a produit ; une ressource est un lien vers ce qui est hébergé ailleurs. Ce que Vision montre a été saisi ici — elle n'interroge aucun de ces outils.",
];

/** Ce que Vision ne fait pas — l'interdit du produit, dit à qui s'en sert. */
const EXCLUSIONS: readonly string[] = [
  "Elle ne pilote pas le travail. Ni planning, ni répartition, ni suivi de ce qui reste à faire : le pilotage reste dans les outils qui le tiennent.",
  "Elle ne conserve aucun fichier. Une ressource est un lien vers ce qui est hébergé ailleurs ; rien n'est déposé ici.",
  "Elle n'évalue personne. Aucune note, aucun classement, aucun indice qu'elle calculerait sur un accompagnement, une personne ou une entité. Les chiffres qu'elle affiche sont des dénombrements de ce qui a été saisi, ou des valeurs reportées d'un outil externe — avec leur date et leur lien.",
  "Elle ne remplace pas l'outil d'audit. Elle en porte la synthèse et le lien vers lui ; le détail se lit dans l'outil qui l'a produit.",
  "Elle ne relance personne. Une date de dernière activité s'affiche ; elle ne se reproche pas.",
];

/** La règle 4, dite à l'usager — elle ferme la section des exclusions. */
const ARCHIVING =
  "Et rien ne s'y supprime : une donnée se range. Elle sort des listes, reste lisible, et se rétablit.";

/**
 * L'état, à la date de rédaction — **ce qui existe, jamais ce qui viendra**.
 *
 * L'état vide que cette note remplace annonçait « ce qui existe, ce qui
 * viendra » : la seconde moitié tombe, la fiche interdisant toute promesse
 * datée. Ce qui reste est constatable écran en main.
 */
const STATE: readonly string[] = [
  "Les écrans existent et servent : la vue d'ensemble, les produits, les accompagnements, l'équipe, l'administration du vocabulaire du domaine, et cette note.",
  "Macro-parcours n'a pas encore d'objet : l'entrée tient sa place, l'écran est vide et le dit.",
  "Les outils externes ne sont pas interrogés. Chaque résultat est saisi à la main, avec sa date et le lien vers l'outil qui l'a produit.",
  "Vision n'envoie pas de courriel : le lien d'une invitation s'affiche à l'écran, et se transmet à la main.",
];

export default function AboutPage() {
  return (
    <Page>
      <PageHeader
        overline="Note interne"
        title="À propos de Vision"
        lead="Qu'est-ce que Vision, et qu'est-ce que ce n'est pas ?"
      />

      <Section>
        <SectionHeader title="Ce qu'est Vision" />
        {THESIS.map((paragraph) => (
          <p key={paragraph} className={PROSE}>
            {paragraph}
          </p>
        ))}
      </Section>

      <Section>
        <SectionHeader
          title="Le vocabulaire"
          note="Cinq niveaux d'appartenance, du plus large au plus fin : chacun contient le suivant, et rien n'existe hors de cette chaîne. Puis quatre mots qui prêtent à confusion."
        />
        {/* Un `<dl>` en colonne — la balise qu'emploient déjà l'en-tête
            d'identité (`components/ui/field.tsx`) et le détail d'un marqueur de
            produit pour un couple intitulé/valeur. Un titre par terme aurait
            posé neuf rangs de plus dans la hiérarchie, pour des définitions
            d'une phrase. */}
        <dl className="flex flex-col gap-3">
          {GLOSSARY.map(({ term, definition }) => (
            <div key={term}>
              <dt className={TERM}>{term}</dt>
              <dd className={PROSE}>{definition}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <SectionHeader
          title="Ce que Vision ne fait pas"
          note="Ces exclusions ne sont pas des manques : ce sont des décisions. Vision décrit une activité, elle n'évalue personne."
        />
        <ul className="flex flex-col gap-2">
          {EXCLUSIONS.map((exclusion) => (
            <li key={exclusion} className={PROSE}>
              {exclusion}
            </li>
          ))}
        </ul>
        <p className={PROSE}>{ARCHIVING}</p>
      </Section>

      <Section>
        <SectionHeader
          title="L'état, au 10 septembre 2026"
          note="Vision est une première version de travail. Ce que cette note décrit est ce qui existe à cette date."
        />
        <ul className="flex flex-col gap-2">
          {STATE.map((fact) => (
            <li key={fact} className={PROSE}>
              {fact}
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}
