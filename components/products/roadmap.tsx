/**
 * La roadmap — la couche que D26 réservait à C5, redessinée le 17/08/2026
 * d'après `docs/design/maquettes/blocs/roadmap/Roadmap.dc.html`.
 *
 * `docs/06` §6 la place **au-dessus de la liste des accompagnements, sans la
 * déplacer** : la liste reste ce qu'elle est depuis T2.2, et devient
 * l'équivalent textuel de la roadmap. **Deux couches sur un axe commun**
 * (`docs/03` §7) : une **bande par accompagnement**, un **repère par activité
 * porteuse d'un résultat**. La troisième — une courbe par indicateur, empilée
 * ici par T5.6 — vit désormais dans son propre bloc, juste en dessous
 * (`indicator-curves.tsx`). L'écart à l'arbitrage (d) de `tickets-C5.md`, qui
 * voulait l'axe partagé par les trois, est consigné dans `JOURNAL-TECHNIQUE.md`.
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
 * **Rendue sur le serveur, sans une ligne de JavaScript**, filtre compris : les
 * préréglages sont des liens, les deux sélecteurs un formulaire GET natif. Les
 * positions viennent de `lib/queries/timeline.ts`, où elles s'éprouvent par des
 * tests ; ce fichier les pose, il ne les calcule pas.
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
 * son intitulé en clair. Le préréglage actif porte `aria-current`, jamais sa
 * seule couleur de fond.
 *
 * **Trois éléments de la maquette ne sont pas rendus**, et chacun a sa raison,
 * consignée dans `JOURNAL-TECHNIQUE.md` : l'ombre portée de la carte — le design
 * system nomme ses trois élévations sans leur donner de valeur, et rien ne
 * s'invente ; le menu « … » (exporter en PDF, partager le lien) — hors du
 * périmètre de `docs/05`, et impossible sans JavaScript ; l'application du
 * filtre à la volée — remplacée par un bouton, pour la même raison.
 *
 * Le composant ne lit aucune base et **ne connaît aucun droit** : la roadmap se
 * lit par tout le domaine (D9), sur un produit vivant comme archivé (règle 4).
 * Elle ne porte aucun geste d'écriture — `de` et `a` sont des paramètres de
 * lecture, et `timelineWindow` est la seule porte par où ils entrent.
 */

import Link from "next/link";

import { Block, BlockHeader } from "@/components/ui/block";
import { BAND_BG, STATUS_PILL } from "@/components/ui/status-dot";
import {
  formatDay,
  formatMonthTick,
  formatPeriodShort,
  formatResultValue,
} from "@/lib/format";
import {
  ROADMAP_FROM_PARAM,
  ROADMAP_TO_PARAM,
  ROUTES,
} from "@/lib/navigation";
import type { ProductProject } from "@/lib/queries/products";
import {
  monthBand,
  monthMark,
  monthTicks,
  timelineScale,
  timelineWindow,
  windowMonths,
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
 * La mention est **nécessaire** : sans elle, une fenêtre resserrée ferait
 * disparaître des accompagnements sans le dire, et la roadmap affirmerait un
 * vide qui n'est que le sien.
 */
function hiddenNotice(count: number): string {
  return count > 1
    ? `${count} accompagnements sont masqués hors de cette période.`
    : "1 accompagnement est masqué hors de cette période.";
}

/** Le calage d'un libellé de graduation sur sa position. */
const TICK_ANCHOR = {
  start: "",
  middle: "-translate-x-1/2",
  end: "-translate-x-full",
} as const;

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
 * La barre de filtre — préréglages, puis fenêtre libre.
 *
 * **Elle se rend même quand le tracé est vide.** Une fenêtre trop étroite
 * enfermerait sinon dans un bloc sans rien, et sans moyen de l'élargir.
 *
 * Les préréglages sont des **liens** et non des boutons : ils mènent à une autre
 * URL de la même page, ce qu'un lien fait et ce qu'un bouton simulerait. Les
 * deux sélecteurs sont un **formulaire GET natif** — pas d'`onChange`, donc pas
 * de JavaScript, donc un bloc qui reste entièrement rendu sur le serveur. Le
 * bouton « Appliquer » est le prix de cette propriété, et l'écart à la maquette
 * est consigné.
 *
 * Soumettre abandonne `archiver`, `indicateur` et `releve` : changer la période
 * ferme un panneau ouvert, ce qui est le comportement attendu.
 */
function FilterBar({
  productId,
  scale,
  window,
}: {
  productId: string;
  /** L'axe **entier** : les préréglages ne se réduisent pas à mesure qu'on filtre. */
  scale: TimelineScale;
  /** La fenêtre courante, pour marquer l'actif et pré-remplir les sélecteurs. */
  window: TimelineScale;
}) {
  const years = windowYears(scale);
  const months = windowMonths(scale);
  const whole =
    window.firstMonth === scale.firstMonth &&
    window.lastMonth === scale.lastMonth;

  const presetClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active
        ? "bg-surface-primary-dark text-content-neutral-pale"
        : "text-content-neutral-dark"
    }`;

  return (
    /* `rounded-2xl` comme les cartes d'indicateur : c'est le rayon des surfaces
       posées **dans** un bloc, le `3xl` restant celui du bloc lui-même. */
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-surface-neutral-lighter bg-surface-neutral-lightest px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          id="roadmap-scale-label"
          className="text-xs font-semibold uppercase text-content-neutral-base"
        >
          Échelle
        </span>
        {/* Un `group` plutôt qu'une `nav` : ce sont des raccourcis de cadrage
            sur la page courante, pas une destination de navigation. */}
        <div
          role="group"
          aria-labelledby="roadmap-scale-label"
          className="flex flex-wrap gap-0.5 rounded-lg bg-surface-neutral-lighter p-1"
        >
          <Link
            href={ROUTES.product(productId)}
            aria-current={whole ? "true" : undefined}
            className={presetClass(whole)}
          >
            Tout
          </Link>
          {years.map((year) => {
            const target = yearWindow(scale, year);
            const active =
              !whole &&
              target.firstMonth === window.firstMonth &&
              target.lastMonth === window.lastMonth;

            return (
              <Link
                key={year}
                href={ROUTES.productRoadmapWindow(
                  productId,
                  `${year}-01`,
                  `${year}-12`,
                )}
                aria-current={active ? "true" : undefined}
                className={presetClass(active)}
              >
                {year}
              </Link>
            );
          })}
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="roadmap-from"
          className="text-sm text-content-neutral-base"
        >
          De
        </label>
        <select
          id="roadmap-from"
          name={ROADMAP_FROM_PARAM}
          defaultValue={window.firstMonth}
          className="rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-2.5 py-1.5 text-sm text-content-neutral-dark"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthTick(month)}
            </option>
          ))}
        </select>

        <label
          htmlFor="roadmap-to"
          className="text-sm text-content-neutral-base"
        >
          à
        </label>
        <select
          id="roadmap-to"
          name={ROADMAP_TO_PARAM}
          defaultValue={window.lastMonth}
          className="rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-2.5 py-1.5 text-sm text-content-neutral-dark"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthTick(month)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-surface-primary-dark px-3 py-1.5 text-sm font-medium text-content-neutral-pale"
        >
          Appliquer
        </button>
      </form>
    </div>
  );
}

export function Roadmap({
  productId,
  projects,
  milestones,
  from,
  to,
}: {
  /** Le produit, pour construire les liens de préréglage vers sa propre page. */
  productId: string;
  /**
   * Les accompagnements **déjà lus par la page** pour la liste juste en dessous
   * (T2.2) : la roadmap ne demande aucune lecture neuve pour ses bandes. Ils
   * arrivent du plus récent au plus ancien, et les lignes gardent cet ordre —
   * celui de la liste, donc celui du parcours au clavier.
   */
  projects: ProductProject[];
  /** Les activités porteuses d'un résultat vivant, de la plus ancienne mesure. */
  milestones: TimelineMilestone[];
  /** Les deux bornes brutes de l'URL. Rien ne les croit avant `timelineWindow`. */
  from: string | undefined;
  to: string | undefined;
}) {
  /* L'axe entier se déduit de **toutes** les dates connues des deux couches, et
     de rien d'autre. Les relevés d'indicateurs n'y entrent plus : ils ont leur
     bloc et leur axe depuis le 17/08/2026. */
  const scale = timelineScale([
    ...projects.flatMap((project) => [project.startedOn, project.expectedEndOn]),
    ...milestones.map((milestone) => milestone.measuredOn),
  ]);

  /* **L'état vide se juge avant la fenêtre** : sans aucune date, il n'y a pas
     d'axe à filtrer, et la barre de filtre n'aurait rien à offrir. */
  if (!scale) {
    return (
      <Block>
        <Header filterable={false} />
        {/* Un paragraphe et non un `EmptyState` — la règle de `Resources` et de
            `Indicators`. La raison qui reste après TD.1, qui a donné un `level`
            à `EmptyState` : **deux phrases distinctes**, là où `EmptyState` n'a
            qu'un `description`. N'avoir aucun accompagnement et n'en avoir aucun
            de daté ne sont pas la même chose, et l'écran ne les confond pas. */}
        {/* `content-neutral-dark`, comme les paragraphes vides des deux autres
            blocs : c'est le jeton d'état vide de la page, et il passe sur les
            deux tonalités de `Block` — 8,12:1 sur la pâle, 6,11:1 sur la bleue,
            là où `content-neutral-base` tombe à 3,75:1 sur la seconde. */}
        <p className="text-sm leading-175 text-content-neutral-dark">
          {projects.length === 0
            ? "La roadmap s'affichera ici dès qu'un accompagnement sera daté : les périodes en barres, les activités porteuses d'un résultat en repères, sur un axe commun."
            : "Aucun accompagnement de ce produit ne porte de date : il n'y a rien à situer sur un axe. La liste ci-dessous porte tous les accompagnements."}
        </p>
      </Block>
    );
  }

  /* La fenêtre demandée, ramenée dans ce que les données portent. C'est le seul
     endroit où `from` et `to` entrent dans un calcul. */
  const window = timelineWindow(scale, from, to);

  /* Un accompagnement sans **aucune** date n'a pas de barre : `docs/03` §7
     interdit de positionner arbitrairement ce qui n'a pas de date, et la liste
     juste en dessous le porte entier. Celui qui n'a qu'une fin est posé sur ce
     seul mois. Puis `withinWindow` écarte ceux que la fenêtre ne montre pas —
     sans lui, `monthBand` les écraserait contre un bord au lieu de les taire. */
  const dated = projects.flatMap((project) => {
    const start = project.startedOn ?? project.expectedEndOn;
    if (!start) return [];
    return [{ project, start, end: project.expectedEndOn }];
  });

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
    <Block>
      <Header filterable />
      <FilterBar productId={productId} scale={scale} window={window} />

      <div className="relative">
        {/* Les filets verticaux, alignés sur les graduations — posés sur la
            seule zone de tracé, jamais sous la colonne des libellés. Ils sont
            décoratifs : la position se lit sur les graduations écrites. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-76 right-0"
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
          <div className="w-70 flex-none" />
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
            <div className="w-70 flex-none">
              <span className="block text-sm font-semibold text-content-neutral-darkest">
                {band.project.name}
              </span>
              {/* La pastille et la période tiennent **sur une seule ligne** :
                  pas de `flex-wrap`, et la période abrégée pour qu'elle y
                  entre — « sept. 2024 » là où `formatPeriod` écrirait
                  « septembre 2024 », qui poussait la période sous la pastille
                  dans une colonne de 280 px. */}
              <span className="flex items-center gap-2">
                <span
                  className={`flex-none rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_PILL[band.project.statusNature]}`}
                >
                  {band.project.statusLabel}
                </span>
                <span className="truncate text-sm text-content-neutral-base">
                  {formatPeriodShort(
                    band.project.startedOn,
                    band.project.expectedEndOn,
                  )}
                </span>
              </span>
            </div>

            {/* La barre est **décorative** : le statut et la période sont écrits
                dans la colonne de gauche, et la couleur ne porte jamais seule. */}
            <div aria-hidden="true" className="relative h-4 min-w-0 flex-1">
              <div
                className={`absolute top-1 h-2.5 rounded-full ${BAND_BG[band.project.statusNature]}`}
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
            <div className="w-70 flex-none text-xs text-content-neutral-base">
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
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-secondary-dark"
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
          <p className="border-t border-surface-neutral-lighter py-6 text-center text-sm leading-175 text-content-neutral-dark">
            Aucun accompagnement sur cette période.
          </p>
        ) : null}
      </div>

      {hidden > 0 ? (
        <p className="text-xs leading-175 text-content-neutral-base">
          {hiddenNotice(hidden)}
        </p>
      ) : null}
    </Block>
  );
}

/**
 * Le titre du bloc.
 *
 * **La carte et l'en-tête ne sont plus propres à ce bloc** (17/08/2026) : ils
 * viennent de `components/ui/block.tsx`, partagés avec « North Star » et
 * « Accompagnements ». C'est cette roadmap qui a servi de référence — son cadre
 * ample et son titre de plein rang sont ce que les trois blocs portent
 * désormais —, si bien que sa coquille n'a pas changé d'apparence en devenant
 * partagée. Ce qui a changé ici tient en un jeton : la note passe de
 * `content-neutral-base` à `content-neutral-dark`, parce que le premier tombe à
 * 3,75:1 sur la surface bleue de la North Star et qu'un en-tête commun prend le
 * jeton qui passe sur les deux tonalités.
 *
 * Il ne reste de local que ce petit composant, et pour une seule raison : **la
 * note ne promet le filtre que lorsqu'il est rendu.** Sans axe, il n'y a pas de
 * barre de filtre — et une note qui inviterait à filtrer désignerait alors un
 * contrôle absent de l'écran.
 */
function Header({ filterable }: { filterable: boolean }) {
  return (
    <BlockHeader
      title="Roadmap"
      note={`Les accompagnements et les activités porteuses d'un résultat, sur un axe commun.`}
    />
  );
}
