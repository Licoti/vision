/**
 * La fiche d'une entreprise cliente — T12.3.
 *
 * **Elle répond à une question à laquelle aucun autre écran ne répond** :
 * *« où en est cette entreprise, et qu'a-t-on fait sur elle ? »*. `docs/06` §2
 * exige cette justification de tout écran au-delà des six — la liste répond
 * *« laquelle peut ouvrir une session ? »*, et **trois booléens ne disent pas
 * une entreprise**. Ce que T9.4 avait dû laisser en tiroirs — l'identité, les
 * identités vérifiées, l'état d'accès — se rassemble ici, et le journal
 * d'administration de C12 y trouve son seul lecteur.
 *
 * **Et depuis T12.4, elle porte les gestes.** T12.3 n'en avait aucun — un ticket
 * de lecture qui se serait autorisé une écriture n'aurait plus été mesurable.
 * Les **six panneaux ciblés** et les **trois formulaires nus** vivent ici
 * désormais, sur la fiche de l'entreprise qu'ils visent, et l'`ActionMenu` de la
 * liste a disparu (arbitrage (1) de `tickets-C12.md`). La raison n'est pas un
 * rangement : *un geste qui vise une entreprise se fait là où cette entreprise
 * est nommée*.
 *
 * **Chaque geste est dans le bloc qui porte le fait qu'il change** : l'état dans
 * « Identité », les deux gestes d'identité vérifiée dans le bloc qui les liste,
 * le compte dans « Accès ». Leurs conditions d'affichage sont **celles de
 * l'`ActionMenu` qu'ils quittent, au mot près** — aucun geste neuf, aucun
 * pouvoir neuf (arbitrage (10) de C11), et le super administrateur ne renomme
 * toujours pas une entreprise.
 *
 * **Aucun menu, et c'est un interdit du ticket.** Un `ActionMenu` ici rouvrirait
 * ce qu'on vient de refermer : ses enfants ne sont rendus qu'une fois ouvert, si
 * bien qu'**aucun de ces gestes n'était dans le HTML servi** — troisième
 * exception à D30 depuis T9.4. Huit ancres et boutons de formulaire la
 * referment, **et cela se mesure**.
 *
 * **Hors du groupe `(app)`**, comme sa liste, `app/auth/` et `app/invitation/` :
 * ni coquille, ni navigation, ni carte de personne courante. Un super
 * administrateur n'a ni domaine ni ligne `persons` (arbitrage (4) de
 * `tickets-C9.md`), `getSession()` rend `null` pour lui, et la barre latérale
 * suppose un domaine.
 *
 * **Trois refus, et leur ordre n'est pas indifférent.** `requireSuperAdmin()`
 * **avant toute lecture**, et elle **redirige** comme la liste : on atteint cet
 * écran sans session du tout, et l'écran d'entrée est la réponse utile. Puis la
 * **forme** de l'identifiant, vérifiée **avant la base** — une colonne `uuid`
 * interrogée avec n'importe quoi rend un 500, pas un 404. Puis la ligne
 * elle-même, absente ou inconnue : `notFound()`.
 *
 * **Ce n'est pas cette route qui protège**, pas plus que celle de la liste : les
 * dix points d'entrée du chantier redérivent l'autorité sur ce qu'ils
 * **reçoivent**. Une route retirée n'a jamais protégé les points d'entrée HTTP
 * qu'elle affichait.
 *
 * **Aucune lecture neuve pour l'identité de l'entreprise.** `listDomainsForAdmin()`
 * rend déjà la ligne, et T12.3 lui a ajouté deux colonnes dans un `select` déjà
 * écrit. C'est la porte qu'`openDomain` (`lib/drawers/domains.tsx`) emprunte
 * pour les six panneaux ciblés ; une septième fonction dans `asSuperAdmin` pour
 * lire une ligne qu'une lecture rend déjà serait la duplication que T9.4 a
 * évitée.
 *
 * **Elle n'accède à aucune donnée d'un domaine** : ni produit, ni
 * accompagnement, ni personne, ni indicateur — seulement l'existence d'un
 * compte. C'est la frontière que la liste écrit et que cette fiche tient sans
 * l'élargir d'un champ : *il administre des entreprises, il ne les traverse
 * pas.*
 *
 * **Aucun décompte, aucun classement, aucune jauge, aucune fraîcheur** (D39,
 * `docs/06` §10). Les trois faits d'accessibilité sont des **faits** — ils
 * disent ce qui s'oppose à l'ouverture d'une session et commandent un geste —,
 * la date de création est une valeur **saisie**, et le journal ne se compte pas.
 */

import type { ReactNode } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { DomainJournal } from "@/components/admin/domain-journal";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { ACTION_LINK_SM } from "@/components/ui/action-link";
import { buttonClass } from "@/components/ui/button";
import { DrawerHost, DrawerLink } from "@/components/ui/drawer";
import { BlockNote } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { Section, SectionHeader } from "@/components/ui/section";
import { AUTH_ROUTES } from "@/lib/auth/provider";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { asSuperAdmin } from "@/lib/db/scoped";
import {
  domainPageRequest,
  DOMAIN_PANEL_PARAMS,
  resolveDomainDrawer,
} from "@/lib/drawers/domains";
import {
  formatDomainStatus,
  formatEventDay,
  formatIdentityProvider,
} from "@/lib/format";
import { ROUTES } from "@/lib/navigation";
import { isUuid } from "@/lib/uuid";

import {
  restoreDomain,
  resumeDomain,
  revokeDomainInvitation,
} from "../actions";
import { loadDomainDrawer } from "../drawers";

/**
 * Un geste qui **défait** : un formulaire nu, sans confirmation.
 *
 * `docs/06` §9 proscrit la confirmation là où elle ne protège rien, et les trois
 * gestes qui la portent ici — rétablir l'entreprise, rétablir l'accès, révoquer
 * l'invitation — se refont d'un clic. **Aucun d'eux n'a de panneau**, et c'est
 * pourquoi ils traversent la page sous cette forme depuis T9.4 : seule la place
 * change.
 *
 * **Un `<form>` et non un `<span>`** dans l'en-tête d'une `Section` : c'est du
 * contenu de flux, et l'en-tête est un `div`. Le mettre dans un élément de
 * phrasé ferait réécrire le balisage par le navigateur.
 */
function BareAction({
  action,
  children,
}: {
  action: () => Promise<void>;
  children: string;
}) {
  return (
    <form action={action}>
      <button type="submit" className={ACTION_LINK_SM}>
        {children}
      </button>
    </form>
  );
}

/**
 * La rangée de gestes d'un bloc — **jamais un menu** (T7.7, et l'interdit du
 * ticket : rouvrir un `ActionMenu` ici rouvrirait l'exception à D30 qu'on vient
 * de refermer).
 *
 * Une simple boîte souple : les gestes se lisent côte à côte, et passent à la
 * ligne plutôt que de comprimer le titre du bloc à 375 px.
 */
function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4">{children}</div>
  );
}

/* L'autorité se relit à chaque requête : rien à mettre en cache. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Entreprise cliente — Vision",
};

export default async function DomainPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  /* L'autorité avant toute lecture — et avant même de regarder l'identifiant.
     Elle redirige : rien de ce qui suit ne s'exécute pour qui ne la porte pas,
     et elle **relit la ligne** à chaque requête. */
  const grant = await requireSuperAdmin();

  const { id } = await params;

  /* **La forme avant la base.** Un identifiant qui n'est pas un UUID n'atteint
     jamais PostgreSQL : une colonne `uuid` interrogée avec n'importe quoi lève,
     et l'écran rendrait 500 là où 404 est la réponse juste. */
  if (!isUuid(id)) notFound();

  const reader = asSuperAdmin(grant);

  const domain = (await reader.listDomainsForAdmin()).find(
    (row) => row.id === id,
  );
  if (!domain) notFound();

  /* **Une troisième lecture depuis le 12/09/2026**, et elle ne sert qu'à
     décider d'un lien : une entreprise vide s'efface, les autres s'archivent.
     Elle ne rend **aucune donnée** du domaine — un booléen et un motif, tirés
     de vingt-quatre sondes d'existence (`domainEmptiness`) : la frontière que
     cet écran ne franchit pas tient, il ne lit toujours pas ce qu'il y a
     dedans. */
  const [identities, events, emptiness] = await Promise.all([
    reader.listDomainIdentities(domain.id),
    reader.listDomainEvents(domain.id),
    reader.domainEmptiness(domain.id),
  ]);

  const archived = domain.archivedAt !== null;

  /* **L'URL reste une adresse, elle n'est plus le mécanisme** (TD.2) : coller
     `?identites=<identifiant>` ouvre le panneau ici, au rendu serveur ; le clic
     passe par `DrawerHost`. Les deux chemins traversent ensuite la **même**
     résolution, et c'est ce qui fait qu'aucune règle ne vit à deux endroits.

     **L'appartenance, l'exclusivité et la forme de la valeur vivent dans
     `domainPageRequest`** : une clé qui désigne une autre entreprise n'ouvre
     rien, deux clés ensemble non plus. */
  const request = domainPageRequest(domain.id, await searchParams);

  const drawer = request ? await resolveDomainDrawer(grant, request) : null;

  return (
    <DrawerHost
      initial={drawer}
      load={loadDomainDrawer}
      panelParams={DOMAIN_PANEL_PARAMS}
      /* **La fiche, jamais la liste.** Un panneau se referme là où il s'est
         ouvert — sans quoi fermer une confirmation ferait perdre l'entreprise
         qu'on regardait. */
      closeHref={ROUTES.domain(domain.id)}
    >
    <main className="mx-auto flex min-h-screen max-w-320 flex-col gap-8 px-6 py-12 md:px-10">
      {/* La coquille tient en deux liens, exactement celle de la liste :
          l'identité de l'écran, et la sortie. Aucune navigation de produit — un
          super administrateur n'entre dans aucun domaine. */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-xl font-bold text-content-neutral-darkest">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-surface-secondary-base"
          />
          Vision
        </p>
        <Link
          href={AUTH_ROUTES.signOut}
          className={buttonClass({ variant: "tertiary", size: "small" })}
        >
          Se déconnecter
        </Link>
      </header>

      <Page>
        <div>
          {/* **Aucun écran n'est un cul-de-sac** (`docs/06` §7), et T7.8 a
              trouvé deux demi-tours là où il fallait un geste. Le fil est celui
              du produit, réemployé tel quel : deux maillons suffisent, cette
              famille d'écrans n'ayant pas de troisième niveau. */}
          <Breadcrumb
            items={[
              { label: "Entreprises clientes", href: ROUTES.domains },
              { label: domain.name },
            ]}
          />

          <PageHeader
            overline="Entreprise cliente"
            title={domain.name}
            lead="Ce que Vision sait de cette entreprise, et ce qui a été fait sur elle depuis sa création."
          />
        </div>

        {/* ------------------------------------------------------------------
            1. L'identité
            ------------------------------------------------------------------ */}
        <Section>
          <SectionHeader
            title="Identité"
            note="Ce que l'entreprise a déclaré d'elle-même, et son état."
            /* **Les gestes d'état, dans le bloc qui porte l'état** (T12.4) : ce
               sont eux qui font changer la ligne « État » deux rangs plus bas.
               Les conditions sont **exactement celles de l'`ActionMenu`** qu'ils
               quittent — aucun geste neuf, aucun pouvoir neuf (arbitrage (10) de
               C11) : le super administrateur ne renomme toujours pas une
               entreprise, et rien ici ne le propose.

               **Une entreprise archivée n'en porte qu'un**, son rétablissement :
               suspendre ou archiver ce qui est déjà rangé n'a pas d'objet, et la
               résolution des deux panneaux le refuse de toute façon sur ce
               qu'elle reçoit. */
            action={
              <Actions>
                {archived ? (
                  <BareAction action={restoreDomain.bind(null, domain.id)}>
                    Rétablir cette entreprise
                  </BareAction>
                ) : (
                  <>
                    {domain.status === "active" ? (
                      <DrawerLink
                        href={ROUTES.domainSuspend(domain.id)}
                        request={{ kind: "suspend", id: domain.id }}
                        className={ACTION_LINK_SM}
                      >
                        Suspendre cette entreprise
                      </DrawerLink>
                    ) : (
                      <BareAction action={resumeDomain.bind(null, domain.id)}>
                        Rétablir l&apos;accès
                      </BareAction>
                    )}

                    <DrawerLink
                      href={ROUTES.domainArchive(domain.id)}
                      request={{ kind: "archive", id: domain.id }}
                      className={ACTION_LINK_SM}
                    >
                      Archiver cette entreprise
                    </DrawerLink>
                  </>
                )}

                {/* **Le neuvième geste — 12/09/2026, hors ticket.** Il est
                    rendu **sur les deux états**, archivé compris : *ranger puis
                    effacer est le chemin naturel* (`deleteProject`). Sa seule
                    condition est le vide, et elle se **lit**, quand celle des
                    quatre autres se lit dans une colonne.

                    **Aucun couple de couleurs neuf par la position** : le lien
                    porte `ACTION_LINK_SM`, celui de ses trois voisins. Ce que
                    le geste a d'irréversible est dit **par le panneau**, en
                    toutes lettres — une couleur d'alerte l'aurait dit moins
                    bien, et à personne sans la voir.

                    Ce n'est pas ce rendu qui protège : `deleteDomain` refait la
                    lecture sur l'identifiant qu'elle **reçoit**. */}
                {emptiness.empty ? (
                  <DrawerLink
                    href={ROUTES.domainDelete(domain.id)}
                    request={{ kind: "delete", id: domain.id }}
                    className={ACTION_LINK_SM}
                  >
                    Supprimer définitivement
                  </DrawerLink>
                ) : null}
              </Actions>
            }
          />

          {/* Une **liste de définitions** : chaque ligne est un couple
              intitulé / valeur, et c'est la seule balise qui le dise à
              l'assistance. Un tableau demanderait des en-têtes de colonne
              qu'il n'y a pas ; une suite de `<p>` perdrait le lien entre les
              deux moitiés.

              **La grille ne se pose qu'à partir de `sm`** : en dessous,
              l'intitulé passe au-dessus de sa valeur plutôt que de comprimer
              les deux — la règle des petits écrans de T7.6, et la raison pour
              laquelle le `<dl>` est un `flex` avant d'être une grille. La
              largeur de colonne est un **rail de mise en page**, écrit comme
              `lg:grid-cols-[20rem_1fr]` de `components/products/indicators.tsx`
              et `xl:grid-cols-[1fr_320px]` de la vue d'ensemble : ce que la
              règle 2 tient sont les couleurs, les espacements et les rayons, qui
              viennent tous du thème ici.

              **Aucun couple de couleurs neuf par la position** :
              `content-neutral-base` pour l'intitulé et `content-neutral-darkest`
              pour la valeur sur `surface-neutral-pale` sont les deux couples de
              tout bloc du produit. */}
          <dl className="flex flex-col gap-3 text-sm sm:grid sm:grid-cols-[12rem_1fr] sm:gap-x-6 sm:gap-y-3 [&>dd]:break-words">
            <dt className="text-content-neutral-base">Centre de compétence</dt>
            <dd className="text-content-neutral-darkest">
              {domain.competenceCenterName}
            </dd>

            <dt className="text-content-neutral-base">Description</dt>
            <dd className="text-content-neutral-darkest">
              {/* **La description est facultative** (T11.4), et son absence se
                  dit plutôt que de laisser un blanc qu'on lirait comme un défaut
                  de rendu. C'est la règle de l'acteur nul du journal. */}
              {domain.description ?? (
                <span className="text-content-neutral-base">
                  Aucune description saisie
                </span>
              )}
            </dd>

            <dt className="text-content-neutral-base">État</dt>
            <dd className="text-content-neutral-darkest">
              {formatDomainStatus(domain)}
            </dd>

            <dt className="text-content-neutral-base">Créée le</dt>
            {/* **Une date saisie, jamais une fraîcheur** : elle situe
                l'entreprise, elle ne la qualifie pas. « Depuis trois mois »
                serait l'indice calculé que D39 refuse.

                **`formatEventDay` et non `formatDay`** : `domains.created_at`
                est un horodatage, quand `formatDay` lit la chaîne `YYYY-MM-DD`
                d'une colonne `date`. Les deux traversent le même formateur au
                jour, en UTC — seule l'entrée les distingue. */}
            <dd className="text-content-neutral-darkest">
              {formatEventDay(domain.createdAt)}
            </dd>
          </dl>
        </Section>

        {/* ------------------------------------------------------------------
            2. Les identités vérifiées
            ------------------------------------------------------------------ */}
        <Section>
          <SectionHeader
            title="Identités vérifiées"
            note="Les entreprises que le fournisseur d'identité rattache à ce domaine. Sans elles, aucun jeton ne le désigne."
            /* **Les deux gestes de l'identité, dans le bloc qui les liste**
               (T12.4). Ils reprennent les mots de l'`ActionMenu` qu'ils
               quittent, et le panneau de gestion — qui **retire** — ne paraît
               que s'il y a quelque chose à gérer : c'est la condition
               `hasIdentity` de la liste, et elle évite un cul-de-sac.

               **Le retrait n'a pas d'entrée ici** : il vit dans le panneau de
               gestion, en formulaire muet, depuis T9.4. Le sortir serait un
               geste neuf, et la fiche n'en ajoute aucun. */
            action={
              !archived ? (
                <Actions>
                  <DrawerLink
                    href={ROUTES.domainIdentityNew(domain.id)}
                    request={{ kind: "identity", id: domain.id }}
                    className={ACTION_LINK_SM}
                  >
                    Ajouter une identité vérifiée
                  </DrawerLink>

                  {domain.hasIdentity ? (
                    <DrawerLink
                      href={ROUTES.domainIdentities(domain.id)}
                      request={{ kind: "identities", id: domain.id }}
                      className={ACTION_LINK_SM}
                    >
                      Gérer les identités vérifiées
                    </DrawerLink>
                  ) : null}
                </Actions>
              ) : null
            }
          />

          {identities.length > 0 ? (
            /* Un `ul` et non un `ol` : l'ordre est celui de la lecture — par
               fournisseur, puis par valeur — et non une information. C'est
               l'inverse du journal juste en dessous, et la distinction est celle
               que le flux de la vue d'ensemble tient déjà. */
            <ul role="list" className="flex flex-col gap-2 text-sm">
              {identities.map((identity) => (
                /* **La forme est celle du panneau de T9.4**
                   (`domain-identities-panel.tsx`), et c'est délibéré : la valeur
                   en évidence, le fournisseur en qualificatif, et le `vérifiée
                   par` porté en propre pour l'assistance. Deux vocabulaires pour
                   une même ligne obligeraient à traduire d'un écran à l'autre —
                   le piège que `NOUNS` évite dans le journal.

                   **`break-words`** : une valeur d'identité est un nom de
                   domaine, donc un mot sans espace où couper. Sans lui, un nom
                   long déborderait de son bloc à 375 px — T7.6 ne repassera
                   pas. */
                <li
                  key={identity.id}
                  className="break-words text-content-neutral-base"
                >
                  <span className="font-semibold text-content-neutral-darkest">
                    {identity.value}
                  </span>
                  <span aria-hidden="true">{" · "}</span>
                  <span className="sr-only">vérifiée par </span>
                  {formatIdentityProvider(identity.provider)}
                </li>
              ))}
            </ul>
          ) : (
            /* **Un état vide qui dit la conséquence, pas l'absence** : ce qui
               importe n'est qu'il n'y ait aucune ligne, c'est que personne ne
               puisse entrer. **Le geste qui le remplit est en tête de bloc**
               depuis T12.4 — `docs/06` §9 veut qu'un état vide propose l'action
               correspondante, et il ne l'avait pas, le geste vivant encore sur
               la liste. */
            <BlockNote>
              Aucune identité vérifiée : aucun jeton ne désigne cette entreprise,
              et personne ne peut ouvrir de session, même avec un compte.
            </BlockNote>
          )}
        </Section>

        {/* ------------------------------------------------------------------
            3. L'accès
            ------------------------------------------------------------------ */}
        <Section>
          <SectionHeader
            title="Accès"
            note="Ce qui s'oppose, ou non, à l'ouverture d'une session."
            /* **Les deux gestes du compte, dans le bloc qui porte le fait qu'ils
               changent** (T12.4), et leurs conditions sont celles de
               l'`ActionMenu` qu'ils quittent, au mot près.

               **La désignation n'ouvre qu'une fois** : une fois un compte posé,
               la suite se passe à l'intérieur du domaine, par son responsable.
               Et pas davantage tant qu'une invitation attend — deux liens
               ouvriraient le même premier compte (T11.4).

               **La révocation est le seul chemin de rattrapage** : sans elle,
               une entreprise dont l'administrateur ne vient jamais resterait
               close, le geste du produit demandant une session que personne ne
               peut ouvrir ici.

               **Ce n'est pas cet écran qui protège** : `designateDomainManager`
               et `revokeDomainInvitation` refont ces décomptes **en base**, sur
               ce qu'elles reçoivent. Un lien absent du rendu n'a jamais protégé
               le point d'entrée qui l'accompagne. */
            action={
              !archived && !domain.hasAccount ? (
                <Actions>
                  {domain.hasPendingInvitation ? (
                    <BareAction
                      action={revokeDomainInvitation.bind(null, domain.id)}
                    >
                      Révoquer l&apos;invitation
                    </BareAction>
                  ) : (
                    <DrawerLink
                      href={ROUTES.domainManager(domain.id)}
                      request={{ kind: "manager", id: domain.id }}
                      className={ACTION_LINK_SM}
                    >
                      Désigner le premier responsable
                    </DrawerLink>
                  )}
                </Actions>
              ) : null
            }
          />

          {/* **Les trois faits de la liste, dans les mots de la liste.** Ce sont
              des **faits d'accessibilité** et non des indices : ils disent ce qui
              empêche une session et commandent un geste, ils ne notent personne.
              Les redire autrement ici aurait fait deux vocabulaires pour une
              même propriété — le piège que `NOUNS` évite dans le journal.

              **Un fait, jamais un décompte** : ni combien d'identités, ni
              combien de comptes, ni depuis quand une invitation attend. */}
          <ul role="list" className="flex flex-col gap-2 text-sm">
            <li className="text-content-neutral-darkest">
              {domain.hasIdentity
                ? "Une identité vérifiée désigne cette entreprise."
                : "Aucune identité — aucun jeton ne la désigne."}
            </li>
            <li className="text-content-neutral-darkest">
              {domain.hasAccount
                ? "Un compte au moins peut se connecter."
                : domain.hasPendingInvitation
                  ? "Invitation en attente — le compte s'ouvrira à l'acceptation."
                  : "Aucun compte — personne ne peut se connecter."}
            </li>
            {/* **Le quatrième fait est celui de l'état, et il prime sur les
                trois autres** : une entreprise suspendue ou archivée n'ouvre
                aucune session, quelles que soient ses identités et ses comptes.
                Le dire ici évite qu'on lise « un compte peut se connecter » sur
                une entreprise fermée. */}
            {domain.status === "suspended" || archived ? (
              <li className="text-content-neutral-darkest">
                {archived
                  ? "Entreprise archivée : aucune session ne s'ouvre, quels que soient les comptes."
                  : "Accès suspendu : aucune session ne s'ouvre, quels que soient les comptes."}
              </li>
            ) : null}
          </ul>
        </Section>

        {/* ------------------------------------------------------------------
            4. Le journal
            ------------------------------------------------------------------ */}
        <DomainJournal events={events} />
      </Page>
    </main>
    </DrawerHost>
  );
}
