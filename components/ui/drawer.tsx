"use client";

/**
 * La coquille des panneaux, et l'état qui décide de leur ouverture — TD.2.
 *
 * **Ce qui change, et ce qui ne change pas.** L'ouverture était un paramètre de
 * recherche : chaque clic naviguait, la page se re-rendait entière, et l'URL
 * changeait. Elle est désormais un état client, et le clic ne touche plus à
 * l'adresse. Ce qui n'a pas bougé : le panneau reste latéral (D30), le contenu
 * reste **rendu sur le serveur**, les droits restent dérivés sur le serveur, et
 * les URL d'ouverture restent des adresses valides — coller `?fiche=<id>` ouvre
 * encore le panneau, au rendu serveur cette fois. C'est le mécanisme qui a
 * bougé, pas la nature du panneau.
 *
 * **Le partage coquille / corps est le cœur du ticket.** Jusqu'ici chaque
 * panneau portait sa coquille entière — voile, tiroir, en-tête, croix, piège de
 * focus — et ses trois sorties étaient des liens. Elle remonte ici, dans un
 * composant client, pour deux raisons qui se rejoignent : la coquille peut
 * alors s'ouvrir **avant** tout aller-retour, ce qui est toute la fluidité
 * demandée ; et `readings-panel.tsx` comme `persona-detail.tsx`, qui sont des
 * composants **serveur**, n'ont plus de fonction de fermeture à recevoir — ce
 * qu'un composant serveur ne peut pas recevoir. Ils restent serveur.
 *
 * **Les sorties restent des `<a href>`**, et pas des boutons. Le clic gauche est
 * intercepté ; tout le reste — clic milieu, `⌘`+clic, « ouvrir dans un onglet »,
 * et l'absence de JavaScript — retombe sur la navigation d'avant, qui menait
 * déjà à la page nue. Un bouton aurait retiré ces trois usages sans rien rendre.
 *
 * **Ce composant ne connaît aucun droit et aucune session.** Il demande, le
 * serveur décide : `load` peut rendre `null`, et la coquille se referme alors.
 * C'est la règle de `panel.tsx` depuis T3.3, et ce n'est de toute façon pas ce
 * rendu qui protège — les actions redérivent le droit sur l'identifiant reçu.
 */

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

import { FocusTrap } from "@/components/ui/focus-trap";
import type { DrawerContent, DrawerRequest } from "@/lib/drawers/types";

/* ==========================================================================
   Le contexte
   ========================================================================== */

type DrawerControls = {
  /** Ouvre le panneau. `trigger` reçoit le focus à la fermeture. */
  open: (request: DrawerRequest, trigger: HTMLElement | null) => void;
  close: () => void;
  /** La page nue. Les sorties y mènent quand le clic n'est pas intercepté. */
  closeHref: string;
};

const DrawerContext = createContext<DrawerControls | null>(null);

/**
 * Les commandes du panneau, pour qui les demande depuis l'intérieur de l'hôte.
 *
 * **Le premier contexte React du dépôt**, et il faut le dire : `list.tsx` avait
 * refusé un `createContext` pour ne pas devenir client. Ici l'hôte l'est déjà,
 * et la seule alternative — descendre une fonction de fermeture à travers un
 * nœud rendu sur le serveur — est précisément ce qui est impossible.
 */
export function useDrawer(): DrawerControls {
  const controls = useContext(DrawerContext);
  if (!controls) {
    throw new Error("useDrawer hors de DrawerHost : la coquille est absente.");
  }
  return controls;
}

/* ==========================================================================
   Les sorties
   ========================================================================== */

/**
 * Une sortie du panneau : la croix, « Annuler », le voile.
 *
 * Un vrai lien vers la page nue, dont le clic gauche est intercepté. Les trois
 * sorties passent par ici, si bien qu'il n'y a **qu'un endroit** où la
 * fermeture se décide — la leçon de TD.1, où quatre copies d'`ACTION_LINK`
 * avaient divergé.
 */
export function DrawerClose({
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { close, closeHref } = useDrawer();
  return (
    <a
      href={closeHref}
      onClick={(event) => {
        if (isModifiedClick(event)) return;
        event.preventDefault();
        close();
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Un point d'entrée : le lien qui ouvre un panneau.
 *
 * Il remplace les `<Link>` des seize points d'entrée de l'application, et le
 * `href` qu'ils portaient déjà ne change pas d'un caractère — c'est ce qui rend
 * la migration mécanique, et ce qui garde l'URL d'ouverture atteignable.
 */
export function DrawerLink({
  request,
  children,
  ...props
}: { request: DrawerRequest } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { open } = useDrawer();
  return (
    <a
      onClick={(event) => {
        if (isModifiedClick(event)) return;
        event.preventDefault();
        open(request, event.currentTarget);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Ce qu'on laisse au navigateur. Un `⌘`+clic ouvre un onglet, un clic milieu
 * aussi : les intercepter serait retirer deux gestes que l'URL rendait
 * possibles, le jour même où l'on garde l'URL pour eux.
 */
function isModifiedClick(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/* ==========================================================================
   L'hôte
   ========================================================================== */

/** Les quatre temps du tiroir. Deux transitoires, le temps du glissement. */
type Phase = "closed" | "entering" | "open" | "leaving";

export function DrawerHost({
  initial,
  load,
  closeHref,
  panelParams,
  children,
}: {
  /**
   * Le panneau que l'**URL** a demandé, résolu par le serveur. Non nul, il
   * s'affiche d'emblée et **sans animation** : il est déjà dans le HTML servi,
   * et l'animer serait un clignotement à l'hydratation.
   */
  initial: DrawerContent | null;
  /**
   * La fonction serveur qui rend le corps. Elle ne fait confiance à aucun de
   * ses arguments : elle relit la session, retrouve l'objet de la page et
   * redérive le droit. `null` veut dire « rien à ouvrir », et la coquille se
   * referme.
   */
  load: (request: DrawerRequest) => Promise<DrawerContent | null>;
  /** La page nue, sans paramètre. Les trois sorties y mènent sans JavaScript. */
  closeHref: string;
  /**
   * Les clés d'URL qui ouvrent un panneau **sur cette page**.
   *
   * Elles ne servent qu'à la fermeture, et pour une raison qu'on ne voit qu'en
   * éprouvant : un panneau ouvert par son adresse, puis refermé, laissait
   * `?vision=modifier` dans la barre — une adresse qui dit ouvert ce qui est
   * fermé, et qui rouvre au rechargement. La fermeture les retire donc, par un
   * `replaceState` : **aucune entrée d'historique n'est empilée** (arbitrage 3),
   * et l'adresse n'est pas *modifiée* mais *remise d'accord* avec l'état.
   *
   * **Retirées une à une, et non remplacées par `closeHref`** : `?de=` et `?a=`
   * ne sont pas des clés d'ouverture — ce sont les bornes de la fenêtre de
   * roadmap —, et les balayer aurait défait un filtre en fermant un panneau.
   * C'est la distinction que `lib/navigation.ts` tient depuis le 17/08/2026.
   */
  panelParams: readonly string[];
  /** Le contenu de la page, qui porte `inert` tant qu'un panneau est ouvert. */
  children: ReactNode;
}) {
  const [content, setContent] = useState<DrawerContent | null>(initial);
  const [phase, setPhase] = useState<Phase>(initial ? "open" : "closed");
  const trigger = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const toRefocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("leaving");
    timer.current = setTimeout(() => {
      setPhase("closed");
      setContent(null);
      /* Le focus revient là d'où le panneau a été ouvert — mais **pas ici** :
         le contenu de page porte encore `inert` à cet instant, et focaliser
         dans un sous-arbre inerte ne fait rien. Éprouvé au navigateur : le
         focus retombait sur `<body>`. On le remet à l'effet qui suit la
         fermeture, quand `inert` est levé. */
      toRefocus.current = trigger.current;
      trigger.current = null;
      forgetPanelParams(panelParams);
    }, drawerDuration());
  }, [panelParams]);

  const open = useCallback(
    (request: DrawerRequest, from: HTMLElement | null) => {
      if (timer.current) clearTimeout(timer.current);
      trigger.current = from;

      /* La coquille d'abord, le corps ensuite : c'est toute la fluidité
         demandée. Le tiroir est monté hors champ au premier rendu, puis
         ramené — un élément monté et déplacé dans le même rendu ne transitionne
         pas, le navigateur n'ayant jamais vu la position de départ. */
      setContent(null);
      setPhase("entering");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase((current) => (current === "entering" ? "open" : current));
        });
      });

      startTransition(async () => {
        const received = await load(request);
        if (received) setContent(received);
        else close();
      });
    },
    [load, close],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const mounted = phase !== "closed";
  const shown = phase === "open";

  /* **Le focus entre dans le panneau, et il faut le poser.** `autoFocus` n'est
     honoré par le navigateur qu'à l'analyse du HTML : il fait le travail quand
     l'URL ouvre — et il est le seul à le faire sans JavaScript —, mais un
     élément inséré par un script ne le reçoit pas. Éprouvé au navigateur, où
     le focus restait sur `<body>` : la coquille s'ouvrait hors du clavier.

     Cherché dans le dialogue plutôt que tenu par une référence sur la croix :
     la référence est posée sur un élément du DOM, si bien que rien ne dépend
     de la façon dont une référence traverse une frontière de composant. */
  useEffect(() => {
    if (!mounted) return;
    dialog.current
      ?.querySelector<HTMLElement>('[aria-label="Fermer le panneau"]')
      ?.focus();
  }, [mounted]);

  /* **Et il ressort là d'où il venait**, ce que la navigation ne faisait pas —
     elle repartait du haut du document. La règle d'`action-menu.tsx`.

     Dans un effet, et non au démontage : le contenu de page porte encore
     `inert` à l'instant où la fermeture est décidée, et focaliser dans un
     sous-arbre inerte ne fait rien. Éprouvé au navigateur, aussi. */
  useEffect(() => {
    if (mounted) return;
    toRefocus.current?.focus();
    toRefocus.current = null;
  }, [mounted]);

  return (
    <DrawerContext.Provider value={{ open, close, closeHref }}>
      {mounted ? (
        <FocusTrap
          onEscape={close}
          className="fixed inset-0 z-40 flex justify-end"
        >
          {/* Le voile ferme au clic, et **ne prend jamais le focus** : la
              fermeture au clavier passe par la croix et par « Annuler », qui
              portent l'une et l'autre un nom. Un lien sans texte, focalisable,
              serait un arrêt de tabulation muet. La règle de T3.2. */}
          <DrawerClose
            aria-hidden="true"
            tabIndex={-1}
            className={`absolute inset-0 bg-surface-neutral-opacity-distinct transition-opacity duration-[var(--duration-drawer)] ease-[var(--easing-drawer)] ${
              shown ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Le filet gauche est **plus sombre que celui des contrôles**, et il
              a été mesuré avant d'être cru (T3.2) : `content-neutral-normal`
              tombe à 1,46:1 contre le voile, c'est-à-dire une limite de panneau
              qu'on devine. `content-neutral-dark` donne 3,05:1 côté voile et
              8,12:1 côté panneau. C'est ce filet qui porte la séparation, faute
              d'ombre : le design system nomme ses élévations sans les définir,
              et l'inventer est interdit (règle 2). */}
          <div
            ref={dialog}
            role="dialog"
            {...(content
              ? { "aria-labelledby": content.titleId }
              : { "aria-label": "Panneau en cours d'ouverture" })}
            className={`relative flex h-full w-110 max-w-full flex-col border-l border-content-neutral-dark bg-surface-neutral-pale transition-transform duration-[var(--duration-drawer)] ease-[var(--easing-drawer)] ${
              shown ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-none items-start justify-between gap-4 border-b border-surface-neutral-lighter px-6 py-5">
              <div className="min-w-0">
                {content?.header ? (
                  content.header
                ) : content ? (
                  <>
                    <h2
                      id={content.titleId}
                      className="text-md font-semibold text-content-neutral-darkest"
                    >
                      {content.title}
                    </h2>
                    {content.subtitles.map((subtitle, index) => (
                      <p
                        key={subtitle}
                        className={
                          index === 0
                            ? "mt-1 text-xs text-content-neutral-base"
                            : "text-xs text-content-neutral-base"
                        }
                      >
                        {subtitle}
                      </p>
                    ))}
                  </>
                ) : null}
              </div>

              {/* `autoFocus` : à l'ouverture, le focus est déjà dans le panneau,
                  et sur la sortie. Rendu dans le HTML servi quand l'URL ouvre,
                  posé au montage quand c'est le clic. */}
              <DrawerClose
                autoFocus
                aria-label="Fermer le panneau"
                className="flex size-8 flex-none items-center justify-center rounded-lg border border-content-neutral-normal text-sm text-content-neutral-dark"
              >
                <span aria-hidden="true">✕</span>
              </DrawerClose>
            </div>

            {content ? (
              content.body
            ) : (
              /* L'attente ne porte aucun titre et n'imite aucun contenu : elle
                 dit qu'elle attend, et c'est tout. Une silhouette grise
                 laisserait croire à une forme que le serveur n'a pas encore
                 choisie. */
              <p
                aria-busy="true"
                className="flex min-h-0 flex-1 items-start px-6 py-5 text-sm text-content-neutral-base"
              >
                Chargement…
              </p>
            )}
          </div>
        </FocusTrap>
      ) : null}

      {/* `inert` reste un attribut, comme avant : le contenu demeure lu et
          affiché derrière le voile, mais ne prend plus ni focus ni clic tant
          que le panneau est ouvert. Ce qui a changé, c'est ce qui le décide —
          un état, et non un paramètre d'URL. */}
      <div inert={mounted}>{children}</div>
    </DrawerContext.Provider>
  );
}

/**
 * La durée du glissement, **lue sur le jeton** et jamais écrite ici.
 *
 * C'est ce qui fait que `prefers-reduced-motion` n'a rien à contrôler côté
 * script : le média abaisse `--duration-drawer` à zéro, la classe cesse
 * d'animer et le démontage cesse d'attendre, du même geste et pour la même
 * raison.
 */
/**
 * Retire de l'adresse les clés qui ouvrent un panneau, sans rien empiler.
 *
 * Ne fait rien quand il n'y en a aucune, c'est-à-dire dans le cas courant — le
 * panneau ouvert au clic, qui n'a jamais écrit l'URL.
 */
function forgetPanelParams(panelParams: readonly string[]): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let touched = false;
  for (const key of panelParams) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      touched = true;
    }
  }
  if (touched) window.history.replaceState(null, "", url.toString());
}

function drawerDuration(): number {
  if (typeof window === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--duration-drawer")
    .trim();
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) return 0;
  return raw.endsWith("ms") ? parsed : parsed * 1000;
}
