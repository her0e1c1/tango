import { useId, type SubmitEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Input } from "@/shared/ui/forms";

interface TagManagementProps {
  tags: string[];
  addForm: UseFormReturn<{ name: string }>;
  renameForm: UseFormReturn<{ name: string }>;
  editingTag: string | undefined;
  error: "required" | "duplicate" | undefined;
  unavailable?: boolean;
  disabled: boolean;
  pending: boolean;
  deletion: string | undefined;
  onAdd: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onRename: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onEdit: (tag: string) => void;
  onCancelEdit: () => void;
  onDelete: (tag: string) => void;
  onCancelDeletion: () => void;
  onConfirmDeletion: () => Promise<void>;
}

export function TagManagement(props: TagManagementProps) {
  const { t } = useTranslation();
  const inputId = useId();
  return (
    <section
      aria-labelledby="deck-tags-heading"
      className="mt-section-gap space-y-4 rounded-surface border border-border p-4 md:p-5"
    >
      <h2 id="deck-tags-heading" className="text-title font-semibold">
        {t("deckTags.title")}
      </h2>
      <p className="text-body text-ink-muted">{t("deckTags.description")}</p>
      {props.unavailable ? <p>{t("deckTags.unavailable")}</p> : null}
      <form noValidate onSubmit={(event) => void props.onAdd(event)}>
        <fieldset
          disabled={props.disabled || props.editingTag !== undefined}
          className="flex flex-wrap items-end gap-2"
        >
          <label htmlFor={`${inputId}-add`} className="min-w-0 flex-1">
            {t("deckTags.newName")}
            <Input
              id={`${inputId}-add`}
              {...props.addForm.register("name")}
              aria-describedby={props.error ? "deck-tag-error" : undefined}
            />
          </label>
          <Button type="submit">{t("deckTags.add")}</Button>
        </fieldset>
      </form>
      {props.error !== undefined && (
        <p id="deck-tag-error" role="alert" className="text-danger">
          {t(`deckTags.${props.error}`)}
        </p>
      )}
      {props.tags.length === 0 && <p>{t("deckTags.empty")}</p>}
      <ul className="space-y-3">
        {props.tags.map((tag) => (
          <li key={tag} aria-label={tag} className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {props.editingTag === tag ? (
              <form noValidate onSubmit={(event) => void props.onRename(event)} className="w-full">
                <fieldset disabled={props.disabled} className="flex flex-wrap items-end gap-2">
                  <label htmlFor={`${inputId}-rename`} className="min-w-0 flex-1">
                    {t("deckTags.renameName")}
                    <Input
                      id={`${inputId}-rename`}
                      {...props.renameForm.register("name")}
                      aria-describedby={props.error ? "deck-tag-error" : undefined}
                    />
                  </label>
                  <Button type="submit">{t("deckTags.save")}</Button>
                  <Button variant="quiet" onClick={props.onCancelEdit}>
                    {t("deckTags.cancel")}
                  </Button>
                </fieldset>
              </form>
            ) : (
              <>
                <span className="min-w-0 flex-1 break-words">{tag}</span>
                <Button variant="quiet" disabled={props.disabled} onClick={() => props.onEdit(tag)}>
                  {t("deckTags.rename")}
                </Button>
                <Button variant="quiet" disabled={props.disabled} onClick={() => props.onDelete(tag)}>
                  {t("deckTags.delete")}
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
      {props.deletion !== undefined && (
        <DestructiveActionDialog
          title={t("deckTags.deleteTitle")}
          targetLabel={t("deckTags.tag")}
          targetName={props.deletion}
          confirmLabel={t("deckTags.delete")}
          description={<p>{t("deckTags.deleteDescription")}</p>}
          pending={props.pending}
          onCancel={props.onCancelDeletion}
          onConfirm={props.onConfirmDeletion}
        />
      )}
    </section>
  );
}
