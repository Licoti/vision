"use client";

/**
 * Le lien d'invitation qu'un panneau vient de créer — T11.4.
 *
 * **Écrit une fois pour deux panneaux.** La création d'une entreprise et la
 * redésignation de son premier responsable rendent exactement le même bloc :
 * l'écrire deux fois aurait aggravé le point ouvert des formes recopiées
 * (`ETAT.md`, la carte radio écrite deux fois), et deux copies divergent un
 * jour. Il ne partage pas celui d'`invitation-panel.tsx`, qui vit dans un autre
 * état — sa refonte demanderait de rouvrir un panneau hors du périmètre de ce
 * ticket (règle 3), et le point est consigné plutôt que pris.
 *
 * **Il ne sait rien du geste qui l'a produit** : il reçoit un lien, un fait
 * d'envoi et une adresse, et il les dit. Aucun droit, aucune session — un
 * composant client n'a rien à faire d'un contexte de droits.
 *
 * **Aucun couple de couleurs neuf par la position** : le lien se rend dans
 * `CONTROL`, le contrôle de saisie du design system, sur le fond de panneau où
 * les dix-sept autres le portent déjà. Rien à remesurer (règle 2).
 */

import { borderOf, CONTROL, FormField } from "@/components/ui/form-field";

export function InvitationLink({
  link,
  sent,
  email,
  expiryDays,
}: {
  /** Le clair du jeton, **rendu une seule fois** : Vision n'en garde que l'empreinte. */
  link: string;
  /** Le courriel est-il parti ? Un fait, jamais un réglage (T11.3). */
  sent: boolean;
  email: string;
  expiryDays: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-content-neutral-darkest">
        {sent ? (
          <>
            L&apos;entreprise est créée et son administrateur est invité : un
            courriel vient de partir vers {email}. Le lien ci-dessous est celui
            de ce message, si vous préférez le transmettre vous-même.
          </>
        ) : (
          <>
            L&apos;entreprise est créée et son administrateur est invité.
            Transmettez ce lien à {email}.
          </>
        )}
      </p>

      {/* Un champ plutôt qu'un paragraphe : un lien se sélectionne d'un geste,
          et se copie sans emporter une espace de mise en page. `readOnly` et
          non `disabled` — un contrôle désactivé ne se sélectionne pas, et
          `disabled:opacity-40` le rendrait illisible. Aucun bouton de copie :
          ce serait du JavaScript pour un geste que le navigateur fait déjà, et
          D30 veut que la page tienne sans. */}
      <FormField
        label="Lien à transmettre"
        htmlFor="amorcage-lien"
        note="Il ne sera plus affiché : Vision n'en garde que l'empreinte, jamais le lien lui-même. Le perdre demande de révoquer l'invitation et d'en créer une autre."
        errorId="amorcage-lien-erreur"
      >
        <input
          id="amorcage-lien"
          readOnly
          value={link}
          onFocus={(event) => event.currentTarget.select()}
          className={`${CONTROL} ${borderOf(undefined)}`}
        />
      </FormField>

      <p className="text-xs text-content-neutral-base">
        Le lien vaut {expiryDays} jours. Il ne connecte personne à lui seul : la
        personne devra passer par son fournisseur d&apos;identité, et c&apos;est
        cette vérification-là qui ouvre son accès et pose son rôle.
      </p>
    </div>
  );
}
