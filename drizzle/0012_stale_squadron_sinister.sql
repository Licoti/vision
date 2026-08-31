/* **Aucune reprise avant suppression, et c'est délibéré.**

   La 0011 en portait une : la cible d'un indicateur existait déjà ailleurs, il
   suffisait de la déplacer. Ici il n'y a rien à déplacer. La période d'un
   accompagnement se déduit désormais des périodes de ses activités, et la seule
   façon de « sauver » une période saisie serait de **fabriquer une activité**
   qui la porte. Vision ne fabrique pas de fait : `docs/03` §6 — « forcer une
   date inventée dégrade la donnée plus que de l'assumer absente ».

   Ce qui est perdu est donc borné et nommable : la période saisie d'un
   accompagnement **dont aucune activité ne porte de date**. Les autres n'ont
   rien à perdre — leurs activités disaient déjà la vérité, et c'est elle qu'on
   affichait à côté. */
ALTER TABLE "projects" DROP COLUMN "started_on";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "expected_end_on";