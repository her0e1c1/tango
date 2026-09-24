import { useEffect, useId, useRef, type SubmitEvent } from "react";
import { useController, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/forms";

interface TagManagementProps {
  tags: string[];
  usageCounts: ReadonlyMap<string, number>;
  addForm: UseFormReturn<{ name: string }>;
  renameForm: UseFormReturn<{ name: string }>;
  editingTag: string | undefined;
  error: string | undefined;
  disabled: boolean;
  deletion: string | undefined;
  onAdd: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onRename: (event: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onEdit: (tag: string) => void;
  onCancelEdit: () => void;
  onDelete: (tag: string) => void;
  onCancelDeletion: () => void;
  onConfirmDeletion: () => void;
}

function getTagErrorKey(error: string): "deckTags.required" | "deckTags.duplicate" {
  return error === "required" ? "deckTags.required" : "deckTags.duplicate";
}

function restoreTagFocus(button: HTMLButtonElement | undefined, addForm: UseFormReturn<{ name: string }>) {
  if (button) button.focus();
  else addForm.setFocus("name");
}

export function TagManagement(props: TagManagementProps) {
  const { t, i18n } = useTranslation();
  const inputId = useId();
  const editButtons = useRef(new Map<string, HTMLButtonElement>());
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>());
  const cancelDeletionButton = useRef<HTMLButtonElement>(null);
  const recoveryButton = useRef<HTMLButtonElement>(null);
  const previous = useRef<{ editingTag: string | undefined; deletion: string | undefined }>({
    editingTag: undefined,
    deletion: undefined,
  });
  const { editingTag, deletion, renameForm, addForm } = props;
  const { field: addName } = useController({ control: addForm.control, name: "name" });
  const { field: renameName } = useController({ control: renameForm.control, name: "name" });
  const active = editingTag !== undefined || deletion !== undefined;
  const busy = props.disabled;
  const operationsDisabled = busy || active;
  const activeTag = editingTag ?? deletion;
  const missingTarget = activeTag !== undefined && !props.tags.includes(activeTag);
  const error =
    props.error === undefined ? null : (
      <p id={`${inputId}-error`} role="alert" className="text-caption text-danger">
        {t(getTagErrorKey(props.error))}
      </p>
    );

  useEffect(() => {
    if (!missingTarget || busy) return;
    previous.current = { editingTag, deletion };
    recoveryButton.current?.focus();
  }, [missingTarget, busy, editingTag, deletion]);

  useEffect(() => {
    // The persistence operation may close its editor before releasing the input lock.
    if (busy || missingTarget) return;
    const before = previous.current;
    previous.current = { editingTag, deletion };
    if (deletion !== undefined && deletion !== before.deletion) {
      cancelDeletionButton.current?.focus();
      return;
    }
    if (editingTag !== undefined && editingTag !== before.editingTag) {
      renameForm.setFocus("name", { shouldSelect: true });
      return;
    }
    if (deletion === undefined && before.deletion !== undefined) {
      restoreTagFocus(deleteButtons.current.get(before.deletion), addForm);
      return;
    }
    if (editingTag === undefined && before.editingTag !== undefined) {
      restoreTagFocus(editButtons.current.get(before.editingTag), addForm);
    }
  }, [editingTag, deletion, renameForm, addForm, missingTarget, busy]);

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="mt-section-gap space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
    >
      <header className="flex items-center gap-3">
        <h2 id={`${inputId}-heading`} className="text-title font-semibold">
          {t("deckTags.title")}
        </h2>
        <span className="rounded-pill bg-surface-muted px-2 text-caption text-ink-muted">
          {props.tags.length.toLocaleString(i18n.language)}
        </span>
      </header>
      <p className="text-caption text-ink-muted">{t("deckTags.description")}</p>
      <form noValidate onSubmit={(event) => void props.onAdd(event)}>
        <fieldset disabled={operationsDisabled} className="flex items-end gap-2">
          <label htmlFor={`${inputId}-add`} className="min-w-0 flex-1 text-caption">
            {t("deckTags.newName")}
            <Input
              id={`${inputId}-add`}
              className="mt-1 min-h-12 text-base"
              {...addName}
              aria-invalid={(props.error !== undefined && editingTag === undefined) || undefined}
              aria-describedby={props.error && editingTag === undefined ? `${inputId}-error` : undefined}
            />
          </label>
          <Button type="submit" variant="primary" className="min-h-12 shrink-0">
            {t("deckTags.add")}
          </Button>
        </fieldset>
        {editingTag === undefined && error}
      </form>
      {props.tags.length === 0 && <p className="text-ink-muted">{t("deckTags.empty")}</p>}
      {missingTarget ? (
        <div className="space-y-2">
          <p role="status" className="text-caption text-ink-muted">
            {t("deckTags.unavailable")}
          </p>
          <button
            ref={recoveryButton}
            type="button"
            disabled={busy}
            onClick={editingTag !== undefined ? props.onCancelEdit : props.onCancelDeletion}
            className="min-h-12 rounded-control border border-border px-3 disabled:opacity-50"
          >
            {t("deckTags.cancel")}
          </button>
        </div>
      ) : null}
      <ul>
        {props.tags.map((tag) => (
          <li
            key={tag}
            aria-label={tag}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border py-3"
          >
            <div className={editingTag === tag || deletion === tag ? "col-span-2 min-w-0" : "min-w-0"}>
              <span className="block wrap-anywhere font-medium">{tag}</span>
              <span className="block text-caption text-ink-muted">
                {t("deckTags.usage", { count: props.usageCounts.get(tag) ?? 0 })}
              </span>
            </div>
            {editingTag === tag ? (
              <form noValidate onSubmit={(event) => void props.onRename(event)} className="col-span-2">
                <fieldset disabled={busy} className="space-y-2">
                  <label htmlFor={`${inputId}-rename`} className="block text-caption">
                    {t("deckTags.renameName")}
                    <Input
                      id={`${inputId}-rename`}
                      className="mt-1 min-h-12 text-base"
                      {...renameName}
                      aria-invalid={props.error !== undefined || undefined}
                      aria-describedby={props.error ? `${inputId}-error` : undefined}
                    />
                  </label>
                  {error}
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="min-h-12" variant="quiet" onClick={props.onCancelEdit}>
                      {t("deckTags.cancel")}
                    </Button>
                    <Button className="min-h-12" variant="primary" type="submit">
                      {t("deckTags.save")}
                    </Button>
                  </div>
                </fieldset>
              </form>
            ) : deletion === tag ? (
              <fieldset aria-labelledby={`${inputId}-delete-title`} className="col-span-2 space-y-3">
                <p id={`${inputId}-delete-title`} className="font-medium">
                  {t("deckTags.deleteTitle")}
                </p>
                <p className="text-caption text-ink-muted">{t("deckTags.deleteDescription")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    ref={cancelDeletionButton}
                    type="button"
                    disabled={busy}
                    onClick={props.onCancelDeletion}
                    className="min-h-12 rounded-control border border-border px-3 disabled:opacity-50"
                  >
                    {t("deckTags.cancel")}
                  </button>
                  <Button variant="destructive" className="min-h-12" disabled={busy} onClick={props.onConfirmDeletion}>
                    {t("deckTags.delete")}
                  </Button>
                </div>
              </fieldset>
            ) : (
              <div className="flex gap-1">
                <button
                  ref={(element) => {
                    if (element) editButtons.current.set(tag, element);
                    else editButtons.current.delete(tag);
                  }}
                  type="button"
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-control text-ink hover:bg-surface-muted disabled:opacity-50"
                  aria-label={t("deckTags.renameLabel", { tag })}
                  disabled={operationsDisabled}
                  onClick={() => props.onEdit(tag)}
                >
                  <AiOutlineEdit aria-hidden="true" className="size-5" />
                </button>
                <button
                  ref={(element) => {
                    if (element) deleteButtons.current.set(tag, element);
                    else deleteButtons.current.delete(tag);
                  }}
                  type="button"
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-control text-danger hover:bg-surface-muted disabled:opacity-50"
                  aria-label={t("deckTags.deleteLabel", { tag })}
                  disabled={operationsDisabled}
                  onClick={() => props.onDelete(tag)}
                >
                  <AiOutlineDelete aria-hidden="true" className="size-5" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="border-t border-border pt-3 text-caption text-ink-muted">{t("deckTags.saveHint")}</p>
    </section>
  );
}
