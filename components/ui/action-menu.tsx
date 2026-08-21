"use client";

/**
 * Le menu contextuel « … » de l'application — un bouton, une liste de gestes.
 *
 * **Il vient de `components/products/indicator-menu.tsx`**, écrit le 17/08/2026
 * pour la seule affordance de `docs/design/maquettes/blocs/northstar` qui ne se
 * rende pas en HTML nu. Il en sort le jour où les cartes d'activité de la
 * roadmap ont eu le même besoin : deux menus « … » aux mesures différentes dans
 * la même application, c'est exactement ce qu'un composant partagé existe pour
 * empêcher. Un seul menu, un seul langage visuel.
 *
 * **Ses mesures sont celles de la demande** : 32×32, fond de surface, bordure de
 * 1px en couleur primaire, rayon de 8px. Elles s'obtiennent toutes par des
 * jetons existants — `h-8 w-8`, `bg-surface-neutral-pale`,
 * `border-border-primary-base`, `rounded-lg` —, donc aucune valeur visuelle
 * n'est écrite en dur (règle 2) et aucun septième substitut n'est inventé.
 * `#ffffff` n'a pas de jeton de surface dans ce thème ; le blanc des cartes est
 * `surface-neutral-pale`, et c'est lui que le bouton reprend.
 *
 * **C'est le seul état d'ouverture porté côté client**, et il faut le redire.
 * Le projet a d'autres composants clients — `panel.tsx`, `confirm-panel.tsx`,
 * `activity-panel.tsx` —, mais aucun ne décide *lui-même* de ce qui est visible :
 * un panneau s'ouvre par un paramètre d'URL et la page le rend (D30, tenu depuis
 * T3.2). Ici l'ouverture est un `useState`. Arbitré le 17/08/2026, consigné dans
 * `JOURNAL-TECHNIQUE.md`.
 *
 * **Ce que ce composant ne connaît pas** : ni droit, ni action serveur, ni
 * session — la règle de `Panel`. Il reçoit des `children` déjà décidés par le
 * serveur : des `<Link>` vers un panneau, des `<form>` liés à une action. Un
 * geste qu'une personne n'a pas le droit de faire n'arrive pas jusqu'ici, et ce
 * n'est de toute façon pas ce rendu qui protège — les actions redérivent le
 * droit sur l'identifiant reçu.
 *
 * **Sans JavaScript, le menu ne s'ouvre pas**, et la régression s'est élargie
 * en passant aux cartes d'activité. Sur le bloc des indicateurs, les gestes
 * restaient atteignables par leur URL (`?indicateur=`, `?releve=`, `?releves=`).
 * Sur une carte d'activité, seuls « Modifier », « Saisir un résultat » et
 * « Annuler l'activité » en ont une : les quatre actions serveur — les deux
 * « Marquer », les deux « Archiver » — **n'ont aucun repli**. C'est le prix de
 * l'arbitrage, et il est plus élevé qu'au premier jour.
 *
 * Trois comportements que le clavier exige, et qu'un `onClick` seul n'aurait pas
 * donnés : `Échap` referme, un clic hors du menu referme, et le focus revient au
 * bouton — sans quoi la tabulation repartirait du début du document.
 *
 * **Il ne prend aucun `className`, et c'est délibéré** (correctif du
 * 17/08/2026) : sa racine porte `relative`, dont son menu déroulant a besoin
 * pour s'ancrer. Un positionnement passé de l'extérieur entrait en conflit avec
 * lui — `absolute` et `relative` se disputent la même propriété, et l'ordre des
 * classes ne tranche pas, seul l'ordre de la feuille générée. Le bouton restait
 * alors dans le flux, en haut à **gauche** de la carte. Qui veut le placer
 * l'enveloppe dans un conteneur positionné.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { buttonClass } from "@/components/ui/button";

export function ActionMenu({
  label,
  children,
}: {
  /**
   * Ce que le bouton dit à l'assistance : « Options du bloc », « Options de
   * l'indicateur Autonomie », « Options de l'activité Atelier de cadrage —
   * mars 2026 ». Trois points ne se lisent pas — la maquette pose un
   * `aria-label`, et il doit **nommer sa cible** quand la page en porte
   * plusieurs. Une roadmap en porte quinze.
   */
  label: string;
  /** Les gestes, décidés par le serveur : des liens et des formulaires. */
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    /* `Échap` referme et **rend le focus au bouton** : sans ce retour, la
       tabulation suivante repartirait du haut du document, ce qui est la
       manière la plus sûre de perdre quelqu'un qui navigue au clavier. */
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };

    /* Le clic extérieur referme **sans** rendre le focus : la personne vient de
       désigner un autre endroit de la page, l'y arracher serait un vol de
       focus. C'est l'écart délibéré avec le comportement d'`Échap`.

       `pointerdown` et non `click` : un `click` se déclenche après que la cible
       a pris le focus, si bien qu'un menu refermé sur `click` mangerait le
       premier clic destiné à ce qu'il recouvre. */
    const onPointerDown = (event: PointerEvent) => {
      const node = event.target;
      if (node instanceof Node && container.current?.contains(node)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((was) => !was)}
        className={buttonClass({ variant: "secondary", iconOnly: true })}
      >
        {/* Les trois points sont **décoratifs** : le bouton est nommé par son
            `aria-label`, et la couleur ne porte jamais seule (docs/06 §11). */}
        <span aria-hidden="true" className="flex flex-col items-center gap-0.5">
          <span className="h-1 w-1 rounded-full bg-surface-primary-dark" />
          <span className="h-1 w-1 rounded-full bg-surface-primary-dark" />
          <span className="h-1 w-1 rounded-full bg-surface-primary-dark" />
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 flex w-60 flex-col gap-0.5 rounded-xl border border-surface-neutral-lighter bg-surface-neutral-pale p-1.5"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * La mise en forme d'une entrée de menu, partagée par les liens et les boutons
 * de formulaire — deux éléments HTML différents pour deux natures de geste, une
 * seule apparence.
 *
 * Exportée plutôt que dupliquée : c'est la leçon de TD.1, où quatre copies
 * d'`ACTION_LINK` avaient divergé.
 */
export const MENU_ITEM =
  "block w-full rounded-lg px-3 py-2 text-left text-sm text-content-neutral-dark";

/** La même, pour un geste qui retire : le rouge du design system, mesuré. */
export const MENU_ITEM_DANGER =
  "block w-full rounded-lg px-3 py-2 text-left text-sm text-content-danger-dark";
