/**
 * La disponibilité d'une personne du centre — les trois valeurs, et la règle
 * qui les produit (28/08/2026).
 *
 * **Un module à elle, et c'est une conséquence, pas un goût.** Deux modules de
 * lecture ont besoin de cette règle — `lib/queries/team.ts` pour la liste et la
 * fiche, `lib/queries/projects.ts` pour la sélection d'équipe d'un formulaire —
 * et le second dépendrait du premier, qui type-importe déjà le second. Le cycle
 * serait erasé à la compilation, donc inoffensif, et il faudrait le savoir pour
 * n'en pas douter. Une règle partagée par deux lecteurs se pose à côté d'eux.
 *
 * **Elle ne vient plus du schéma.** La colonne `persons.availability`, son
 * `CHECK` `persons_availability_requires_center` et le type
 * `person_availability` sont tombés avec la migration `0010` : une valeur
 * déduite n'a pas de colonne — la stocker serait se donner deux autorités sur
 * un même mot, et elles finiraient par diverger.
 *
 * **C'est un indice calculé par Vision pour qualifier une personne, et D39 les
 * interdit.** L'écart est arbitré par l'humain et consigné dans
 * `JOURNAL-TECHNIQUE.md` ; l'arbitrage (b) de C5bis l'annonçait en toutes
 * lettres — « une liste fermée de trois valeurs dont la logique dépendra
 * directement le jour où elle **se dérivera des accompagnements** ».
 *
 * **Ce qui reste tenu, et qui n'est pas une consolation** : la valeur se dit en
 * trois mots, jamais en un nombre ; aucun écran ne trie ni ne classe par
 * disponibilité (garde-fous 2 et 3 de C5bis). Le décompte est un mécanisme, il
 * n'est pas une mesure qu'on affiche.
 */

/**
 * Les trois disponibilités, dans l'ordre où le formulaire les proposait — de la
 * plus disponible à la moins. Le filtre de `/equipe` les propose dans cet ordre.
 */
export const PERSON_AVAILABILITY_VALUES = [
  "available",
  "partial",
  "unavailable",
] as const;

export type PersonAvailability = (typeof PERSON_AVAILABILITY_VALUES)[number];

/**
 * Les bornes du seuil, **écrites une fois** : la dérivation les lit, et le
 * filtre SQL de `listTeam` les lit aussi.
 *
 * Sans ce tableau, la liste et son propre filtre finiraient par dire deux
 * vérités — le genre d'écart qu'on ne découvre qu'à la troisième personne qui
 * manque à un filtre où elle devrait être. `max: null` vaut « sans plafond ».
 */
export const AVAILABILITY_BOUNDS: Record<
  PersonAvailability,
  { min: number; max: number | null }
> = {
  available: { min: 0, max: 0 },
  partial: { min: 1, max: 2 },
  unavailable: { min: 3, max: null },
};

/**
 * La disponibilité, **déduite** du nombre d'accompagnements vivants dont la
 * personne est membre.
 *
 * `0` → disponible · `1` ou `2` → partiellement disponible · `3` et plus →
 * indisponible. **Le seuil est humain**, arrêté le 28/08/2026 : c'est la
 * réponse à la question que le commentaire de `persons.availability` laissait
 * ouverte depuis C5bis — « un nombre ? une charge ? une période ? ». Vision n'a
 * ni charge ni période dans son modèle ; elle a un nombre.
 *
 * **La base est l'accompagnement en cours** : ni archivé, ni **terminé**. Un
 * accompagnement dont le statut est de nature `done` a cessé d'occuper qui l'a
 * mené — c'est l'arbitrage du 28/08/2026, qui a **corrigé** une première version
 * comptant tout ce qui n'était pas archivé : quelqu'un dont le seul
 * accompagnement venait de se terminer y restait indisponible.
 *
 * **Les autres natures comptent, `paused` comprise.** Une pause n'est pas une
 * fin : l'accompagnement reprendra, et la personne y est encore attendue. Seule
 * `done` sort, parce que seule elle dit que le travail est fait.
 *
 * **La fiche d'une personne peut donc lister un accompagnement et la dire
 * disponible**, et ce n'est pas une contradiction : chaque ligne de cette liste
 * porte sa pastille de statut, et « Terminé » s'y lit. La liste raconte un
 * parcours, la pastille dit une charge.
 *
 * **Elle ne s'applique qu'au centre** : un intervenant côté entité ne porte pas
 * de disponibilité (arbitrage (d) de C5bis). Ce sont les appelants qui le
 * tiennent, le `CHECK` qui le tenait en base étant tombé avec la colonne.
 *
 * **Cette fonction ne sait pas ce qu'elle compte**, et c'est voulu : elle reçoit
 * un nombre. Ce qui entre dans ce nombre — ni archivé, ni terminé — est décidé
 * par les trois lectures qui l'appellent, et c'est la seule chose qu'elles
 * doivent dire à l'identique. `lib/queries/team.test.ts` a le témoin qui tombe
 * quand l'une d'elles diverge.
 */
export function availabilityFromProjects(count: number): PersonAvailability {
  for (const value of PERSON_AVAILABILITY_VALUES) {
    const { min, max } = AVAILABILITY_BOUNDS[value];
    if (count >= min && (max === null || count <= max)) return value;
  }
  /* Inatteignable : les trois plages couvrent tous les entiers positifs, et la
     dernière n'a pas de plafond. Le compilateur ne le sait pas, et lever ici
     serait une panne d'écran pour une branche qui ne s'ouvre pas — on rend la
     valeur de la plage ouverte. */
  return "unavailable";
}
