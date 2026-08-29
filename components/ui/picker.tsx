"use client";

/**
 * Le champ qui cherche une option au lieu de déployer la liste entière.
 *
 * **Il ne connaît pas les personnes.** Il connaît des options — un identifiant,
 * un libellé, un indice — et une fonction qui rend une ligne. C'est ce qui lui
 * permet de vivre dans le socle : la dépendance va du métier vers ici, jamais
 * l'inverse (`uiLayerSeal`), et c'est pourquoi la pastille de disponibilité de
 * `components/team/` reste chez l'appelant, passée par `renderRow`.
 *
 * **Le HTML servi ne bouge pas d'une ligne, et c'est tout le propos.** Le
 * premier rendu — celui du serveur, donc celui qu'on obtient sans JavaScript —
 * est la liste complète d'aujourd'hui, une ligne par option, tous les contrôles
 * présents et soumettables. `mounted` bascule au montage et remplace cet
 * affichage par le champ de recherche et les seules options retenues. Deux
 * modes, **une seule `renderRow`** : un repli écrit deux fois est un repli qui
 * divergera.
 *
 * **Le champ n'a pas d'attribut `name`** : il ne doit jamais entrer dans le
 * `FormData`. Ce qui est soumis, ce sont les contrôles que `renderRow` rend, et
 * eux seuls — le contrat des formulaires appelants ne change pas d'un caractère.
 *
 * **Les suggestions sont dans le flux, pas en `absolute`.** Ce composant sert
 * une page longue *et* un panneau latéral qui défile ; un survol positionné se
 * ferait rogner dans le second, et il faudrait alors un ancrage et un
 * `z-index` à maintenir pour chaque hôte. La liste pousse le contenu, et rien
 * ne peut la couper.
 *
 * **Le clavier est écouté en natif sur le champ, et non par `onKeyDown`.** Deux
 * touches doivent être interceptées avant tout le monde :
 *
 * - `Entrée`, qui soumettrait le formulaire qui entoure le champ ;
 * - `Échap`, que `FocusTrap` écoute **sur `document`** pour refermer le tiroir
 *   (`components/ui/focus-trap.tsx`). Fermer une liste de suggestions ne doit
 *   pas fermer le panneau qui la contient.
 *
 * Un `onKeyDown` de React ne suffit pas : React attache ses écouteurs à la
 * racine, et un `stopPropagation()` synthétique n'empêche pas un second
 * écouteur posé sur le même nœud. Un écouteur natif sur le champ lui-même
 * s'exécute à la phase cible, donc avant que l'événement n'atteigne quoi que ce
 * soit d'autre — c'est le seul endroit d'où l'on peut arrêter les deux.
 *
 * Le reste des comportements est repris de `components/ui/action-menu.tsx`, où
 * il a déjà été mesuré : le clic extérieur referme **sans** rendre le focus —
 * la personne vient de désigner un autre endroit de la page, l'y arracher
 * serait un vol de focus —, et `pointerdown` plutôt que `click`, un `click` se
 * déclenchant après que la cible a pris le focus.
 */

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { CONTROL_TEXT, borderOf } from "@/components/ui/form-field";
import {
  matchOptions,
  type PickerOption,
} from "@/lib/forms/picker";

/** L'instantané ne change jamais : rien à surveiller, rien à désabonner. */
const NEVER = () => () => {};
const ON_CLIENT = () => true;
const ON_SERVER = () => false;

export function Picker<T extends PickerOption>({
  searchLabel,
  placeholder,
  note,
  options,
  chosen,
  onChoose,
  renderRow,
  emptyOptions,
  noMatch,
  countLabel,
}: {
  /** Le `<label>` du champ : « Rechercher une personne ». */
  searchLabel: string;
  /** Le texte d'invite, jamais un libellé déguisé (`docs/06` §11). */
  placeholder: string;
  /** La phrase qui dit à quoi sert le bloc. Rendue dans les deux modes. */
  note: ReactNode;
  /** Toutes les options du référentiel, dans leur ordre de lecture. */
  options: readonly T[];
  /** Ce qui est retenu, tenu par l'appelant — c'est lui qui le soumet. */
  chosen: readonly string[];
  /** Une suggestion retenue. L'appelant décide ce que « retenu » veut dire. */
  onChoose: (id: string) => void;
  /**
   * La ligne d'une option. `enhanced` dit lequel des deux modes la demande :
   * sans JavaScript elle est rendue pour **toutes** les options, avec elle ne
   * l'est que pour les retenues — et peut alors porter le geste de retrait.
   */
  renderRow: (option: T, enhanced: boolean) => ReactNode;
  /** Le référentiel vide : un écran à part entière, jamais une erreur. */
  emptyOptions: ReactNode;
  /** Ce qu'on lit quand la saisie ne rapproche rien. */
  noMatch: string;
  /** Le décompte annoncé : `(shown, total) => "3 personnes sur 12"`. */
  countLabel: (shown: number, total: number) => string;
}) {
  /* Faux au premier rendu, donc identique au serveur : c'est ce qui évite le
     décalage d'hydratation, et c'est aussi ce qui rend le repli exact.

     `useSyncExternalStore` plutôt qu'un `useState` basculé dans un effet : le
     mécanisme est celui que React prévoit pour distinguer les deux instantanés
     — celui du serveur et celui du client —, et il n'écrit aucun état depuis un
     effet, ce que `react-hooks/set-state-in-effect` refuse. */
  const mounted = useSyncExternalStore(NEVER, ON_CLIENT, ON_SERVER);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const prefix = useId();
  const fieldId = `${prefix}-recherche`;
  const listId = `${prefix}-suggestions`;
  const optionId = (index: number) => `${prefix}-option-${index}`;

  const container = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  const held = new Set(chosen);
  const matches = matchOptions(options, query, held);
  const open = mounted && matches.shown.length > 0;

  /* Ce que l'écouteur natif a besoin de savoir. Rafraîchi après chaque rendu
     plutôt que capturé dans une fermeture : l'écouteur est posé une fois, il ne
     doit pas se réattacher à chaque frappe. */
  const now = useRef({ open, shown: matches.shown, active, onChoose });
  useEffect(() => {
    now.current = { open, shown: matches.shown, active, onChoose };
  });

  useEffect(() => {
    const node = field.current;
    if (!node) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const { open: isOpen, shown, active: index, onChoose: choose } = now.current;

      if (event.key === "Escape") {
        /* Rien à refermer : l'événement continue son chemin, et le tiroir se
           ferme comme il le ferait depuis n'importe quel autre champ. */
        if (!isOpen && !node.value) return;
        event.preventDefault();
        event.stopPropagation();
        setQuery("");
        setActive(0);
        return;
      }

      if (event.key === "Enter") {
        /* Sans cette ligne, `Entrée` soumettrait le formulaire qui entoure le
           champ — l'enregistrement partirait au premier nom cherché. */
        if (!isOpen) return;
        event.preventDefault();
        event.stopPropagation();
        const picked = shown[index];
        if (!picked) return;
        choose(picked.id);
        setQuery("");
        setActive(0);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (!isOpen) return;
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((was) => (was + step + shown.length) % shown.length);
        return;
      }

      if (event.key === "Tab" && isOpen) {
        /* La liste se referme, la tabulation se poursuit : on ne piège pas le
           focus dans un champ de recherche. */
        setQuery("");
        setActive(0);
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
    /* `mounted` et non `[]` : au premier commit — celui de l'hydratation, qui
       rend le repli — le champ **n'existe pas**, et un effet monté une seule
       fois n'aurait jamais trouvé de nœud où s'attacher. Il se rejoue donc à la
       bascule, où le champ est là. */
  }, [mounted]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target;
      if (node instanceof Node && container.current?.contains(node)) return;
      setQuery("");
      setActive(0);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (options.length === 0) return <>{emptyOptions}</>;

  /* Le repli, et le HTML servi : toutes les options, tous les contrôles. */
  if (!mounted) {
    return (
      <>
        {note}
        <div className={BLOCK}>
          {options.map((option) => (
            /* `Fragment` et non `<div>` : le repli doit rendre le balisage
               d'avant **au caractère près**, et un conteneur de clé s'y verrait
               — mesuré dans le HTML servi, pas supposé. */
            <Fragment key={option.id}>{renderRow(option, false)}</Fragment>
          ))}
        </div>
      </>
    );
  }

  const kept = options.filter((option) => held.has(option.id));

  return (
    <>
      {note}

      <div ref={container} className="flex flex-col gap-2">
        <label
          htmlFor={fieldId}
          className="text-2xs font-semibold text-content-neutral-dark uppercase"
        >
          {searchLabel}
        </label>
        <input
          ref={field}
          id={fieldId}
          type="text"
          role="combobox"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open ? optionId(active) : undefined}
          className={`${CONTROL_TEXT} ${borderOf(undefined)}`}
        />

        {/* Le décompte s'entend autant qu'il se voit : sans lui, une liste qui
            se réduit à la frappe ne dit rien à qui ne la voit pas. */}
        <p aria-live="polite" className="text-xs text-content-neutral-base">
          {query.trim()
            ? open
              ? countLabel(matches.shown.length, matches.total)
              : noMatch
            : ""}
        </p>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={searchLabel}
            className="flex flex-col gap-0.5 rounded-lg border border-surface-neutral-lighter bg-surface-neutral-pale p-1.5"
          >
            {matches.shown.map((option, index) => (
              <li
                key={option.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                /* Le focus reste dans le champ : sans ce `preventDefault`, le
                   clic le lui prendrait et refermerait la liste avant que le
                   `click` n'arrive. */
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChoose(option.id);
                  setQuery("");
                  setActive(0);
                  field.current?.focus();
                }}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${
                  index === active
                    ? "bg-surface-primary-base text-content-neutral-pale"
                    : "text-content-neutral-darkest"
                }`}
              >
                {option.label}
                {option.hint ? (
                  <span
                    className={
                      index === active
                        ? "text-xs text-content-neutral-pale"
                        : "text-xs text-content-neutral-base"
                    }
                  >
                    {` · ${option.hint}`}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {kept.length > 0 ? (
        <div className={BLOCK}>
          {kept.map((option) => (
            <Fragment key={option.id}>{renderRow(option, true)}</Fragment>
          ))}
        </div>
      ) : null}
    </>
  );
}

/**
 * Le cadre des lignes — celui que les deux formulaires portaient déjà, repris
 * ici au caractère près pour que le HTML servi ne bouge pas.
 */
const BLOCK =
  "flex flex-col gap-3 rounded-lg border border-content-neutral-normal bg-surface-neutral-pale px-4 py-4";
