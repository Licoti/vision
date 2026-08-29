/* Reprise avant suppression, écrite à la main : `drizzle-kit` ne génère que les
   deux `drop column`, et les appliquer seuls perdrait la cible.

   Un indicateur qui n'en porte pas hérite de celle de ses adoptions, quand
   toutes s'accordent sur la même valeur. Le désaccord ne se tranche pas ici :
   l'indicateur reste sans cible, et l'écran le dit déjà — « Aucune cible de
   produit. Le panneau de correction de l'indicateur permet d'en poser une. »

   Le domaine n'a pas à figurer dans la jointure : `project_indicators.indicator_id`
   pointe une ligne d'`indicators`, et les deux portent le même `domain_id` par
   construction — la couche d'accès n'a jamais laissé écrire autrement. */
UPDATE "indicators" AS i
SET "target_value" = t."target_value"
FROM (
  SELECT "indicator_id", MIN("target_value") AS "target_value"
  FROM "project_indicators"
  WHERE "target_value" IS NOT NULL
  GROUP BY "indicator_id"
  HAVING COUNT(DISTINCT "target_value") = 1
) AS t
WHERE i."id" = t."indicator_id" AND i."target_value" IS NULL;--> statement-breakpoint
ALTER TABLE "project_indicators" DROP COLUMN "target_value";--> statement-breakpoint
ALTER TABLE "project_indicators" DROP COLUMN "final_value";