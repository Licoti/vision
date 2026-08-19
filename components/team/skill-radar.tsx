/**
 * Le **radar des compétences** d'une personne — T5bis.5.
 *
 * La forme d'un profil, d'un coup d'œil : un axe par compétence déclarée, un
 * sommet posé au rang déclaré. Second dessin du projet, après la frise.
 *
 * **Composant serveur, sans une ligne de JavaScript** : le SVG est rendu par la
 * fonction serveur du panneau, comme le reste de la fiche. Aucune dépendance,
 * aucune bibliothèque de graphiques, aucune mesure de viewport — la discipline
 * du tracé de `components/products/indicators.tsx`, et l'interdit commun aux
 * sept tickets de C5bis.
 *
 * **Aucune trigonométrie ici.** Les sommets viennent de `lib/queries/radar.ts`,
 * purs et testés, comme les positions de la frise viennent de `timeline.ts`.
 * Ce fichier place, il ne calcule pas.
 *
 * **Il porte un `viewBox`, là où la frise s'en est privée** (arbitrage (f) de
 * `tickets-C5bis.md`) : un radar est un carré de taille fixe, ses coordonnées
 * sont des nombres, et `<polygon>` y est donc disponible.
 *
 * **Le texte reste hors du SVG** (même arbitrage) : le dessin ne porte que la
 * géométrie, et les libellés d'axe sont du HTML posé par-dessus, positionné aux
 * coordonnées mêmes des axes. C'est ce qui leur laisse la taille de texte de la
 * page plutôt que celle du `viewBox` — la séparation qui a rendu `path`
 * possible à la courbe d'indicateurs.
 *
 * **Le dessin ne porte jamais seul une information** (garde-fou 6) : la liste
 * « compétence — niveau » en toutes lettres reste sous lui, et c'est elle qui
 * dit les valeurs. C'est la règle de la pastille de statut (`docs/06` §11),
 * appliquée à un graphique.
 *
 * **Un radar, une personne** (garde-fou 4) : il ne vit que dans la fiche, jamais
 * dans la liste ni dans un formulaire, et jamais deux profils sur un dessin.
 * Ses axes étant **les seules compétences que la personne déclare** (garde-fou
 * 5), ils changent d'une personne à l'autre — la superposition et la
 * comparaison visuelle sont structurellement impossibles.
 *
 * **Rien n'y est calculé** (garde-fou 2, D39) : ni aire, ni moyenne, ni score,
 * ni pourcentage, ni valeur de comparaison — ni médiane d'équipe, ni niveau
 * attendu, ni cible. Une cible n'a de sens que sur un produit, jamais sur une
 * personne.
 */

import { axisPoints, polygonPoints } from "@/lib/queries/radar";
import type { TeamSkill } from "@/lib/queries/team";

/**
 * Le rayon du dessin, dans un `viewBox` de cent.
 *
 * Cinquante et pas un autre nombre : les coordonnées rendues **sont** alors les
 * pourcentages dont les libellés se placent, et le composant n'a aucune
 * conversion à faire entre le repère du SVG et celui du HTML posé dessus.
 */
const RADIUS = 50;

/** Trois axes sont le minimum d'un polygone. En dessous, aucun dessin. */
const MIN_AXES = 3;

/** De quel côté un libellé se cale sur la position de son axe. */
function anchorOf({ x, y }: { x: number; y: number }): string {
  /* Le calage est **positionnel, jamais métrique** — la règle d'`anchor` de
     `monthTicks` : on compare au centre et aux bords, on ne règle pas un seuil
     en pourcentage qui ne vaudrait que pour une largeur donnée. Les
     comparaisons sont exactes parce que `round` normalise les sommets : la
     pointe du haut tombe sur `50 / 0` au chiffre près, quel que soit le nombre
     d'axes. */
  const horizontal =
    x === RADIUS
      ? "-translate-x-1/2"
      : x > RADIUS
        ? "ml-1"
        : "-translate-x-full -ml-1";

  const vertical =
    y === 0
      ? "-translate-y-full -mt-1"
      : y === RADIUS * 2
        ? "mt-1"
        : "-translate-y-1/2";

  return `${horizontal} ${vertical}`;
}

export function SkillRadar({
  fullName,
  skills,
  levelScaleMax,
}: {
  fullName: string;
  /** **Dans l'ordre de la fiche** : rang décroissant puis libellé. */
  skills: readonly TeamSkill[];
  /** Le rang le plus haut de l'échelle **du domaine**, jamais de la personne. */
  levelScaleMax: number;
}) {
  /* **Ce n'est pas un état d'erreur, et il ne se dit donc pas.** En dessous de
     trois compétences il n'y a pas de polygone à tracer, et la liste écrite
     tient seule l'écran — le cas de l'indicateur sans relevé de T5.1, qui se
     constate et ne s'invente pas. Une phrase d'excuse ferait d'une déclaration
     partielle un défaut de saisie. */
  if (skills.length < MIN_AXES || levelScaleMax <= 0) return null;

  const axes = axisPoints(skills.length, RADIUS);
  const shape = polygonPoints(
    skills.map((skill) => skill.levelRank),
    levelScaleMax,
    RADIUS,
  );

  const attribute = (points: { x: number; y: number }[]) =>
    points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    /* Les deux gouttières sont la place des libellés : le tiroir fait 440 px,
       ce qui laisse un peu plus de 350 px dans la carte — le dessin en prend
       160, chaque libellé jusqu'à 80. */
    <div className="flex justify-center px-20 py-6">
      <div className="relative h-40 w-40">
        <svg
          role="img"
          viewBox="0 0 100 100"
          /* `overflow-visible` parce que le contour touche le bord du
             `viewBox` : sans lui, la moitié de son trait serait rognée — la
             parade du tracé de `indicators.tsx`. */
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {/* **Un seul enfant, et une chaîne** : React 19 traite `<title>` comme
              une balise de métadonnée hoistable et n'en accepte pas deux
              — mesuré, un `{"…de "}{fullName}` rend un `<title></title>`
              **vide** dans le HTML servi, donc un dessin sans nom accessible.
              L'interpolation se fait donc avant, pas dans le balisage. */}
          <title>{`Radar des compétences déclarées de ${fullName}`}</title>

          {/* **La toile.** Un rayon par axe et le contour au rang le plus haut :
              sans ce cadre, « Avancé » et « Expert » se dessineraient pareil,
              un polygone sans échelle ne disant rien. Ce n'est pas une
              graduation — aucun anneau intermédiaire, aucun chiffre. */}
          {axes.map((point, index) => (
            <line
              key={skills[index]!.id}
              x1={RADIUS}
              y1={RADIUS}
              x2={point.x}
              y2={point.y}
              vectorEffect="non-scaling-stroke"
              className="stroke-surface-neutral-light"
            />
          ))}
          <polygon
            points={attribute(axes)}
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-surface-neutral-light"
          />

          {/* **Le profil.** Une seule couleur de thème, aucune légende. Le
              remplissage ne porte rien que le tracé ne dise ; c'est le tracé
              qui tient la forme, et la liste dessous qui tient les valeurs. */}
          <polygon
            points={attribute(shape)}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="fill-surface-primary-lighter stroke-content-primary-dark"
          />
        </svg>

        {/* Les libellés d'axe, **hors du SVG** : les coordonnées valent les
            pourcentages, le rayon étant de 50 dans une boîte de 100.

            `aria-hidden` parce qu'ils **répètent** la liste écrite juste
            dessous, mot pour mot : le SVG porte déjà son `role="img"` et son
            `<title>`, et faire relire six libellés à la voix n'ajouterait rien
            à ce que la liste dit mieux, avec leur niveau. Rien n'est
            focalisable — à la différence des bandes de la frise, qui avaient
            imposé `role="group"` en T5.5. */}
        {axes.map((point, index) => (
          <span
            key={skills[index]!.id}
            aria-hidden="true"
            className={`absolute max-w-20 text-2xs text-content-neutral-dark ${anchorOf(point)}`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            {/* Le libellé **passe à la ligne, il ne se tronque pas** : une
                compétence à demi écrite serait un nom qu'on ne peut plus
                reconnaître. */}
            {skills[index]!.label}
          </span>
        ))}
      </div>
    </div>
  );
}
