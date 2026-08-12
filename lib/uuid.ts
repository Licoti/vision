/**
 * La forme d'un identifiant, vérifiée avant la base.
 *
 * Un paramètre d'URL est saisi par n'importe qui. Interroger une colonne
 * `uuid` avec « n-importe-quoi » n'est pas une recherche infructueuse : c'est
 * une erreur PostgreSQL (`invalid input syntax for type uuid`), donc une page
 * en 500 là où l'on attendait un 404. Constaté en vérifiant T2.1.
 *
 * Le motif vit ici, et non dans chaque écran : deux copies divergent.
 */

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vrai si la chaîne a la forme d'un UUID. Ne dit rien de son existence. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
