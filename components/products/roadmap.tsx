/**
 * La roadmap — la couche que D26 réservait à C5, redessinée le 17/08/2026
 * d'après `docs/design/maquettes/blocs/roadmap/Roadmap.dc.html`.
 *
 * **Le bloc s'intitule « Accompagnements »** (21/08/2026), il est **le seul** de
 * la page à les porter, et il vient **juste après « Vision produit »** : ce qu'on
 * fait sur ce produit se lit avant ce que le produit est. « Tous les
 * accompagnements », qui le suivait, lisait le même tableau, dans le même ordre,
 * vers la même destination de clic : le doublon était assumé — « son équivalent
 * textuel » — et il est refermé. Ce qui n'existait que là a été versé ici :
 * **l'objectif** sur chaque ligne, une section **« Sans date »**, et l'état vide
 * qui porte le geste.
 * L'équipe y avait été versée aussi, puis **retirée le jour même** : trop de
 * place pour ce qu'elle disait. Le bloc perd du même coup le « en cours » de son
 * titre : sa fenêtre cadre l'année en cours, mais son contenu est toute
 * l'histoire du produit.
 *
 * **Deux couches sur un axe commun** (`docs/03` §7) : une **bande par
 * accompagnement**, un **repère par activité porteuse d'un résultat**. La
 * troisième — une courbe par indicateur, empilée ici par T5.6 — vit désormais
 * dans le bloc « Vision produit » (`indicators.tsx`, où `indicator-curves.tsx`
 * a été fusionné). L'écart à l'arbitrage (d) de `tickets-C5.md`, qui voulait
 * l'axe partagé par les trois, est consigné dans `JOURNAL-TECHNIQUE.md`.
 *
 * **La ligne des repères est masquée pour le POC** (`SHOW_MILESTONES`, demande
 * du 17/08/2026) : il n'en reste qu'une seule à l'écran. Le code de la couche
 * est intact, ses dates portent toujours l'axe, et la rallumer est un booléen.
 *
 * **C'est la juxtaposition de `docs/03` §7, et rien d'autre.** Elle répond à
 * « est-ce que ce que nous avons recommandé a fonctionné ? » en donnant à lire,
 * pas en concluant : aucune moyenne, aucune tendance, aucune projection.
 *
 * **En HTML, et non plus en SVG.** La maquette dessine une grille à deux
 * colonnes — l'identité de l'accompagnement à gauche, sa barre à droite —, et
 * une grille de texte n'a rien à faire dans un dessin vectoriel. Trois choses
 * s'en trouvent gagnées : les libellés sont du texte sélectionnable, les lignes
 * sont des liens que l'arbre d'accessibilité expose sans détour, et la
 * contrainte qui gouvernait la frise disparaît — **pas de `viewBox`, donc pas de
 * `polyline`**, qui reste vraie dans le bloc des courbes et n'a plus cours ici.
 *
 * **Le filtre est le seul JavaScript du bloc, et il ne calcule rien**
 * (21/08/2026). Les préréglages étaient des liens vers `?de=&a=` : filtrer
 * était une navigation entière — l'URL changeait, le défilement repartait en
 * haut. Ils sont devenus les boutons de `ScaleSwitch`, et **ce fichier rend une
 * frise par préréglage**, que le commutateur monte à la demande. Les positions
 * continuent donc de venir de `lib/queries/timeline.ts`, au rendu serveur, où
 * elles s'éprouvent par des tests ; ce fichier les pose, il ne les calcule pas.
 * Le formulaire « De / à », masqué depuis le 18/08/2026, disparaît avec l'URL
 * qu'il écrivait.
 *
 * **Vision juxtapose, elle ne prouve pas.** Aucune annotation de causalité entre
 * une bande et un repère, aucun écart, aucune flèche d'impact, aucun pourcentage
 * d'avancement sur une bande, aucune dépendance entre activités : ce n'est pas
 * un diagramme de Gantt (`docs/06` §10, `docs/03` §6), et `docs/03` §7 nomme le
 * « +12 % depuis l'accompagnement » comme le point de bascule.
 *
 * **La couleur ne porte jamais seule** (`docs/06` §11) : chaque ligne écrit son
 * libellé, son statut en toutes lettres dans sa pastille et sa période ; la
 * barre est décorative et sort de l'arbre d'accessibilité ; chaque repère porte
 * son intitulé en clair. Le préréglage actif porte `aria-pressed`, jamais sa
 * seule couleur de fond.
 *
 * **Deux éléments de la maquette ne sont pas rendus**, et chacun a sa raison,
 * consignée dans `JOURNAL-TECHNIQUE.md` : l'ombre portée de la carte — le design
 * system nomme ses trois élévations sans leur donner de valeur, et rien ne
 * s'invente ; le menu « … » (exporter en PDF, partager le lien) — hors du
 * périmètre de `docs/05`. Le troisième, **l'application du filtre à la volée**,
 * est refermé : c'est exactement ce que la demande du 21/08/2026 obtient.
 *
 * Le composant ne lit aucune base et **ne connaît aucun droit** : la roadmap se
 * lit par tout le domaine (D9), sur un produit vivant comme archivé (règle 4).
 * Son unique point d'entrée d'écriture — celui de l'état vide — arrive en
 * `addHref`, déjà décidé par l'appelant, `null` quand il n'a pas lieu d'être.
 */

import Link from "next/link";

import { ScaleSwitch, type ScalePreset } from "@/components/products/roadmap-scale";
import { Block, BlockDivider, BlockHeader } from "@/components/ui/block";
import { buttonClass } from "@/components/ui/button";
import { BlockNote, EmptyState } from "@/components/ui/empty-state";
import { List, ListRow } from "@/components/ui/list";
import { BAND_BG, StatusPill } from "@/components/ui/status-pill";
import {
  formatDay,
  formatMonthTick,
  formatPeriodShort,
  formatResultValue,
} from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import type { ProductProject } from "@/lib/queries/products";
import {
  monthBand,
  monthMark,
  monthTicks,
  timelineScale,
  windowYears,
  withinWindow,
  yearWindow,
  type TimelineMilestone,
  type TimelineScale,
} from "@/lib/queries/timeline";

/**
 * Ce qu'un repère dit au survol, et à l'assistance.
 *
 * Le résultat est une valeur **reportée** d'un outil externe, avec sa date
 * (D39) : la date se lit au **jour** — la seule entorse au mois, bornée à une
 * date de mesure depuis T4.3, parce qu'un audit rendu le 31 mai perdrait son
 * sens en « mai 2024 ». Aucun jugement n'est tiré de la valeur.
 *
 * L'accompagnement est nommé : un repère vit sur sa propre ligne, sous les
 * bandes, et rien d'autre ne dirait de quel accompagnement il vient.
 */
function milestoneTitle(milestone: TimelineMilestone): string {
  const value = formatResultValue(milestone.resultValue, milestone.resultUnit);

  return [
    milestone.typeLabel,
    value ? `${milestone.resultLabel} : ${value}` : milestone.resultLabel,
    formatDay(milestone.measuredOn),
    milestone.projectName,
  ].join(" · ");
}

/**
 * Ce que la fenêtre laisse de côté, dit d'une phrase entière.
 *
 * **Deux phrases choisies par le décompte**, et non une phrase à suffixes :
 * c'est la leçon du refus (e) relevée en T5.1 — un `plural` gouverne le nom et
 * le premier accord, jamais les suivants, et « 1 accompagnements masqués » se
 * lit faux sans que personne ne s'en aperçoive.
 *
 * La mention est **nécessaire**, et elle l'est deux fois plus depuis que la
 * liste du bas n'existe plus : sans elle, une fenêtre resserrée ferait
 * disparaître des accompagnements sans le dire, et le bloc affirmerait un vide
 * qui n'est que le sien.
 */
function hiddenNotice(count: number): string {
  return count > 1
    ? `${count} accompagnements sont masqués hors de cette période. « Tout » les ramène.`
    : "1 accompagnement est masqué hors de cette période. « Tout » le ramène.";
}

/** Le calage d'un libellé de graduation sur sa position. */
const TICK_ANCHOR = {
  start: "",
  middle: "-translate-x-1/2",
  end: "-translate-x-full",
} as const;

/**
 * La largeur de la colonne d'identité, et l'endroit où l'axe commence.
 *
 * **Les deux valeurs vont ensemble** : les filets verticaux sont posés en
 * absolu sur toute la hauteur du tracé, et ils doivent commencer exactement là
 * où finissent la colonne et l'écart qui la suit (`gap-6`, 24 px). Les changer
 * séparément décrocherait les graduations des barres — 352 + 24 = 376.
 *
 * La colonne est passée de 280 à 352 px le 21/08/2026 : elle porte désormais
 * l'objectif, versé par le bloc « Tous les accompagnements ». Elle ne rétrécit
 * pas quand l'équipe en repart le même jour — un objectif de deux lignes vaut
 * mieux qu'un objectif de quatre.
 */
const IDENTITY_WIDTH = "w-88";
const AXIS_LEFT = "left-94";

/**
 * La ligne des repères, **masquée pour le POC** (demande du 17/08/2026).
 *
 * Un drapeau, et non une suppression : la couche est celle de T5.5, elle a ses
 * données (`listProductMilestones`), son calcul (`monthMark`) et son intitulé.
 * Tout reste en place et compile ; la rallumer est ce booléen. Les dates de
 * mesure continuent de porter l'axe, si bien que le retour de la ligne ne
 * déplacera aucune barre.
 */
const SHOW_MILESTONES = false;

/**
 * L'identité d'un accompagnement : ce qu'on lit avant sa barre.
 *
 * **Un seul dessin pour les deux endroits** où un accompagnement se lit dans ce
 * bloc — la colonne de gauche de la frise, et la section « Sans date ». C'est
 * ce qui garantit qu'un accompagnement daté et un accompagnement sans date se
 * lisent pareil, la barre en moins.
 *
 * L'objectif est **coupé à deux lignes** : c'est une colonne, pas une fiche, et
 * la page de l'accompagnement porte le texte entier. L'`overflow-hidden` de la
 * colonne est la ceinture de cette bretelle — un mot sans espace ne déborde pas
 * sur l'axe.
 *
 * **L'équipe n'y est plus** (21/08/2026, second passage) : la pile d'avatars y a
 * tenu une demi-journée. Elle prenait plus de place qu'elle n'en disait — un
 * visage ne dit pas ce qu'on a fait sur ce produit —, et elle se lit sur la page
 * de l'accompagnement, où elle a son bloc.
 */
function ProjectIdentity({
  project,
  period,
}: {
  project: ProductProject;
  /** La période déjà formulée, ou `null` quand il n'y en a pas à écrire. */
  period: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 overflow-hidden">
      {/* La pastille et la période tiennent **sur une seule ligne** : pas de
          `flex-wrap`, et la période abrégée pour qu'elle y entre — « sept.
          2024 » là où `formatPeriod` écrirait « septembre 2024 ». */}
      <span className="flex items-center gap-2 text-xs">
        <StatusPill nature={project.statusNature} label={project.statusLabel} />
        {period ? (
          <span className="truncate text-content-neutral-base">{period}</span>
        ) : null}
      </span>

      <span className="text-sm font-semibold text-content-neutral-darkest">
        {project.name}
      </span>

      {project.objective ? (
        <span className="line-clamp-2 text-sm text-content-neutral-base">
          {project.objective}
        </span>
      ) : null}
    </div>
  );
}

/** Un accompagnement daté, et les deux bornes qui le posent sur l'axe. */
type DatedProject = {
  project: ProductProject;
  start: string;
  end: string | null;
};

/**
 * La frise d'une fenêtre : son axe, ses bandes, ses repères.
 *
 * **Elle est rendue une fois par préréglage** (21/08/2026) et c'est ce qui
 * permet au filtre de n'être qu'un `useState` : le serveur dessine « Tout » et
 * chaque millésime, `ScaleSwitch` monte celui qu'on demande. Elle reçoit les
 * accompagnements datés **déjà triés**, calculés une seule fois par l'appelant :
 * seule la position dépend de la fenêtre.
 */
function Timeline({
  window,
  dated,
  milestones,
}: {
  window: TimelineScale;
  dated: DatedProject[];
  milestones: TimelineMilestone[];
}) {
  /* `withinWindow` écarte ceux que la fenêtre ne montre pas — sans lui,
     `monthBand` les écraserait contre un bord au lieu de les taire. */
  const bands = dated
    .filter((row) => withinWindow(window, row.start, row.end))
    .map((row) => ({ ...row, ...monthBand(window, row.start, row.end) }));

  const hidden = dated.length - bands.length;

  /* Les repères aussi se taisent hors fenêtre : un repère de 2024 ramené contre
     le bord d'une fenêtre 2026 affirmerait une date qu'il n'a pas. */
  const marks = milestones.filter((milestone) =>
    withinWindow(window, milestone.measuredOn, milestone.measuredOn),
  );

  const ticks = monthTicks(window);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        {/* Les filets verticaux, alignés sur les graduations — posés sur la
            seule zone de tracé, jamais sous la colonne des libellés. Ils sont
            décoratifs : la position se lit sur les graduations écrites. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 ${AXIS_LEFT}`}
        >
          {ticks.map((tick) => (
            <div
              key={tick.month}
              className="absolute inset-y-0 w-px bg-surface-neutral-lightest"
              style={{ left: `${tick.left}%` }}
            />
          ))}
        </div>

        {/* ---- L'en-tête d'axe : son filet, ses graduations ---- */}
        <div className="flex gap-6">
          <div className={`${IDENTITY_WIDTH} flex-none`} />
          <div className="relative h-9 min-w-0 flex-1">
            <div className="absolute inset-x-0 bottom-5 h-px bg-surface-neutral-lighter" />
            {ticks.map((tick) => (
              <span
                key={tick.month}
                className={`absolute bottom-0 whitespace-nowrap text-xs text-content-neutral-base ${TICK_ANCHOR[tick.anchor]}`}
                style={{ left: `${tick.left}%` }}
              >
                {formatMonthTick(tick.month)}
              </span>
            ))}
          </div>
        </div>

        {/* ---- Une ligne par accompagnement de la fenêtre ----

            Chaque ligne **mène à sa page projet** — la règle de descente de
            `docs/06` §7 —, et la maquette n'y change rien : elle ne pose qu'un
            `title` sur la barre, mais une règle de navigation prime sur un
            dessin. Le contour de focus est celui de tout le produit
            (`*:focus-visible`, `app/globals.css`). */}
        {bands.map((band) => (
          <Link
            key={band.project.id}
            href={ROUTES.project(band.project.id)}
            className="flex items-center gap-6 border-t border-surface-neutral-lighter py-4"
          >
            <div className={`${IDENTITY_WIDTH} flex-none`}>
              <ProjectIdentity
                project={band.project}
                period={formatPeriodShort(
                  band.project.startedOn,
                  band.project.expectedEndOn,
                )}
              />
            </div>

            {/* La barre est **décorative** : le statut et la période sont écrits
                dans la colonne de gauche, et la couleur ne porte jamais seule. */}
            <div aria-hidden="true" className="relative h-4 min-w-0 flex-1">
              <div
                className={`absolute top-1 h-2 rounded-full ${BAND_BG[band.project.statusNature]}`}
                style={{ left: `${band.left}%`, width: `${band.width}%` }}
              />
            </div>
          </Link>
        ))}

        {/* ---- Les repères : une activité porteuse d'un résultat ----

            Sur leur propre ligne, comme dans le croquis de `docs/03` §7 : ce
            sont les « activités marquantes positionnées sur l'axe ». Une
            activité sans résultat n'y figure pas — la roadmap de son
            accompagnement reste le seul endroit où elle se lit.

            Aucun lien : la fiche n'en demande que sur les bandes (règle 3).
            L'intitulé est porté deux fois — `title` pour le survol, `sr-only`
            pour l'assistance, un `title` seul n'étant pas exposé de façon
            fiable sur un élément sans contenu. */}
        {SHOW_MILESTONES && marks.length > 0 ? (
          <div className="flex items-center gap-6 border-t border-surface-neutral-lighter py-4">
            <div
              className={`${IDENTITY_WIDTH} flex-none text-xs text-content-neutral-base`}
            >
              Activités porteuses d&apos;un résultat
            </div>
            <div className="relative h-4 min-w-0 flex-1">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-1/2 h-px bg-surface-neutral-lighter"
              />
              {marks.map((milestone) => (
                <span
                  key={milestone.id}
                  title={milestoneTitle(milestone)}
                  className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-secondary-dark"
                  style={{
                    left: `${monthMark(window, milestone.measuredOn)}%`,
                  }}
                >
                  <span className="sr-only">{milestoneTitle(milestone)}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {bands.length === 0 ? (
          <BlockNote className="border-t border-surface-neutral-lighter py-6 text-center">
            Aucun accompagnement sur cette période.
          </BlockNote>
        ) : null}
      </div>

      {hidden > 0 ? (
        <p className="text-xs leading-175 text-content-neutral-base">
          {hiddenNotice(hidden)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Les accompagnements que rien ne date, sous la frise.
 *
 * **Ils sont hors du commutateur d'échelle**, et à double titre : ils ne
 * dépendent d'aucune fenêtre — ils se lisent sous « Tout » comme sous un
 * millésime —, et les sortir évite de les rendre une fois par préréglage.
 *
 * `docs/03` §7 interdit de positionner arbitrairement ce qui n'a pas de date :
 * ils n'ont donc pas de barre, et c'est la seule chose qui les distingue des
 * lignes du dessus. Avant le 21/08/2026, c'est le bloc « Tous les
 * accompagnements » qui les portait ; sans cette section, ils auraient disparu
 * de la page avec lui.
 *
 * La `List` est **à fond perdu** : la carte est celle du bloc, et une liste qui
 * gardait la sienne ferait une carte dans une carte.
 */
function Undated({ projects }: { projects: ProductProject[] }) {
  return (
    <div className="flex flex-col gap-3">
      <BlockDivider
        title="Sans date"
        note={
          projects.length > 1
            ? `${projects.length} accompagnements`
            : "1 accompagnement"
        }
        rule="bg-surface-neutral-lighter"
      />

      <List flush label="Les accompagnements de ce produit sans date">
        {projects.map((project) => (
          <ListRow key={project.id} flush href={ROUTES.project(project.id)}>
            <ProjectIdentity project={project} period={null} />
          </ListRow>
        ))}
      </List>
    </div>
  );
}

export function Roadmap({
  projects,
  milestones,
  addHref,
}: {
  /**
   * Les accompagnements **déjà lus par la page** (T2.2) : ce bloc ne demande
   * aucune lecture neuve. Ils arrivent du plus récent au plus ancien, les non
   * datés en dernier, et les lignes gardent cet ordre — celui du parcours au
   * clavier.
   */
  projects: ProductProject[];
  /** Les activités porteuses d'un résultat vivant, de la plus ancienne mesure. */
  milestones: TimelineMilestone[];
  /** `null` retire le point d'entrée — le composant ne connaît aucun droit. */
  addHref: string | null;
}) {
  /* **L'état vide se juge en premier** : c'est le seul cas où le bloc porte un
     geste, et `EmptyState` est ce qui le place (règle 5). Les deux autres cas
     d'absence — aucune date, aucune bande dans la fenêtre — ont quelque chose
     à montrer, et prennent un paragraphe. */
  if (projects.length === 0) {
    return (
      <Block>
        <Header />
        <EmptyState
          level={3}
          title="Aucun accompagnement pour l'instant"
          description="Les accompagnements de ce produit s'afficheront ici, du plus récent au plus ancien, chacun avec sa période, son statut et son objectif. Ceux qui portent des dates se posent sur un axe."
          {...(addHref
            ? {
                action: (
                  <Link href={addHref} className={buttonClass()}>
                    Nouvel accompagnement
                  </Link>
                ),
              }
            : {})}
        />
      </Block>
    );
  }

  /* Un accompagnement sans **aucune** date n'a pas de barre : `docs/03` §7
     interdit de positionner arbitrairement ce qui n'a pas de date. Celui qui
     n'a qu'une fin est posé sur ce seul mois. */
  const dated: DatedProject[] = [];
  const undated: ProductProject[] = [];

  for (const project of projects) {
    const start = project.startedOn ?? project.expectedEndOn;
    if (start) dated.push({ project, start, end: project.expectedEndOn });
    else undated.push(project);
  }

  /* L'axe entier se déduit de **toutes** les dates connues des deux couches, et
     de rien d'autre. Les relevés d'indicateurs n'y entrent plus : ils ont leur
     bloc et leur axe depuis le 17/08/2026. */
  const scale = timelineScale([
    ...projects.flatMap((project) => [project.startedOn, project.expectedEndOn]),
    ...milestones.map((milestone) => milestone.measuredOn),
  ]);

  /* **Sans axe, pas de fenêtre à filtrer** : il n'y a que des accompagnements
     sans date, et la section du bas les porte tous. */
  if (!scale) {
    return (
      <Block>
        <Header />
        {/* Un paragraphe et non un `EmptyState` — la règle de `Resources` et de
            `Indicators` : le bloc n'est pas vide, il n'a rien à situer sur un
            axe. `content-neutral-dark` est le jeton d'état vide de la page. */}
        <BlockNote>
          Aucun accompagnement de ce produit ne porte de date : il n&apos;y a
          rien à situer sur un axe.
        </BlockNote>
        <Undated projects={undated} />
      </Block>
    );
  }

  /* Un préréglage, une frise. **« Tout », puis un millésime par année
     d'histoire** — la seule granularité que la demande du 18/08/2026 retient. */
  const years = windowYears(scale);
  const presets: ScalePreset[] = [
    {
      key: "all",
      label: "Tout",
      view: <Timeline window={scale} dated={dated} milestones={milestones} />,
    },
    ...years.map((year) => ({
      key: String(year),
      label: String(year),
      view: (
        <Timeline
          window={yearWindow(scale, year)}
          dated={dated}
          milestones={milestones}
        />
      ),
    })),
  ];

  /* **La fenêtre d'ouverture est l'année en cours**, et l'axe entier quand elle
     n'y est pas — la règle de `defaultWindow`, transposée aux clés : sans le
     repli, un produit terminé en 2024 s'ouvrirait sur un préréglage qui n'existe
     pas. La lecture de l'horloge est ici, comme avant : une fonction qui lirait
     l'heure ne s'éprouverait pas par un test. */
  const currentYear = new Date().getFullYear();
  const initial = years.includes(currentYear) ? String(currentYear) : "all";

  return (
    <Block>
      <Header />
      <ScaleSwitch presets={presets} initial={initial} />
      {undated.length > 0 ? <Undated projects={undated} /> : null}
    </Block>
  );
}

/**
 * Le titre du bloc — « Accompagnements » depuis le 21/08/2026.
 *
 * **La carte et l'en-tête ne sont pas propres à ce bloc** (17/08/2026) : ils
 * viennent de `components/ui/block.tsx`, partagés avec « Vision produit »,
 * « Personae » et « Use Cases ». C'est cette roadmap qui a servi de référence —
 * son cadre ample et son titre de plein rang sont ce que les blocs portent
 * désormais.
 *
 * **Le titre a perdu « en cours »** le jour où « Tous les accompagnements » a
 * été retiré : le bloc porte toute l'histoire du produit, sa fenêtre n'en cadre
 * qu'une part, et un titre qui dirait « en cours » promettrait un filtre sur le
 * statut que le bloc n'a jamais fait — aucun accompagnement n'est écarté sur ce
 * qu'il est.
 *
 * **Le mot « roadmap » ne paraît pas à l'écran** : le bloc dit ce qu'il montre.
 * Le nom du fichier et celui du composant ne suivent pas : ils désignent la
 * couche de `docs/03` §7, qui n'a pas changé de nature.
 */
function Header() {
  return (
    <BlockHeader
      title="Accompagnements"
      note="Les accompagnements de ce produit, posés sur le temps."
    />
  );
}
