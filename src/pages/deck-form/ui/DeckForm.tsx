import type * as React from "react";
import { useId } from "react";
import { type UseFormReturn, useFormState } from "react-hook-form";

import type { DeckId } from "@/entities/deck";
import { Button } from "@/shared/ui/button";
import { Form, FormItem, Input, Select, Switch } from "@/shared/ui/forms";

import type { DeckFormValues } from "../model/useDeckForm";

const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleDateString();

export interface DeckFormProps {
  categories: readonly string[];
  deckInfo: {
    id: DeckId;
    createdAt: number;
    updatedAt: number;
  };
  form: UseFormReturn<DeckFormValues>;
  isLocalOnly: boolean;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

export const DeckForm: React.FC<DeckFormProps> = (props) => {
  const formState = useFormState({ control: props.form.control });
  const categoryOptions = props.categories.map((category) => ({ label: category, value: category }));
  const sectionHeadingIdPrefix = useId();
  const basicHeadingId = `${sectionHeadingIdPrefix}-deck-basic-heading`;
  const storageHeadingId = `${sectionHeadingIdPrefix}-deck-storage-heading`;
  const importHeadingId = `${sectionHeadingIdPrefix}-deck-import-heading`;
  const nameInputId = `${sectionHeadingIdPrefix}-deck-name`;
  const nameErrorId = `${nameInputId}-error`;
  const urlInputId = `${sectionHeadingIdPrefix}-deck-url`;
  const urlErrorId = `${urlInputId}-error`;
  const localModeHelp = props.isLocalOnly
    ? "Turn off to save this deck and its cards to Firestore. This change cannot be undone."
    : "This deck and its cards are saved to Firestore.";

  return (
    <Form onSubmit={props.onSubmit}>
      <section
        aria-labelledby={storageHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={storageHeadingId} className="text-title font-semibold text-ink">
            Storage
          </h2>
          <p className="mt-1 text-caption text-ink-muted">Choose whether this deck stays on this device.</p>
        </div>
        <FormItem label="Local only" help={localModeHelp}>
          <Switch {...props.form.register("localMode")} aria-label="Local only" disabled={!props.isLocalOnly} />
        </FormItem>
      </section>
      <section
        aria-labelledby={basicHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={basicHeadingId} className="text-title font-semibold text-ink">
            Basic information
          </h2>
          <p className="mt-1 text-caption text-ink-muted">Name and organize this deck.</p>
        </div>
        <FormItem
          col
          label="Name"
          inputId={nameInputId}
          errorId={nameErrorId}
          {...(formState.errors.name?.message !== undefined ? { error: formState.errors.name.message } : {})}
        >
          <Input
            {...props.form.register("name")}
            id={nameInputId}
            aria-invalid={formState.errors.name != null || undefined}
            aria-describedby={formState.errors.name !== undefined ? nameErrorId : undefined}
          />
        </FormItem>
        <FormItem col label="Category">
          <Select empty {...props.form.register("category")} options={categoryOptions} />
        </FormItem>
      </section>
      <section
        aria-labelledby={importHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={importHeadingId} className="text-title font-semibold text-ink">
            Import &amp; formatting
          </h2>
          <p className="mt-1 text-caption text-ink-muted">Control the source and how imported text is displayed.</p>
        </div>
        <FormItem
          col
          label="Source URL"
          inputId={urlInputId}
          errorId={urlErrorId}
          {...(formState.errors.url?.message !== undefined ? { error: formState.errors.url.message } : {})}
        >
          <Input
            {...props.form.register("url", {
              // Keep optional Deck URLs absent even though an empty HTML input reports an empty string.
              setValueAs: (value: unknown) => (value === "" ? undefined : value),
            })}
            id={urlInputId}
            aria-invalid={formState.errors.url != null || undefined}
            aria-describedby={formState.errors.url !== undefined ? urlErrorId : undefined}
          />
        </FormItem>
        <FormItem label="Convert line breaks" help="Convert two line breaks to one <br />.">
          <Switch {...props.form.register("convertToBr")} aria-label="Convert line breaks" />
        </FormItem>
      </section>
      <details className="rounded-surface border border-border bg-surface-muted p-4">
        <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">
          Deck information
        </summary>
        <dl className="mt-4 grid gap-3 text-caption">
          <div className="min-w-0">
            <dt className="font-medium text-ink-muted">ID</dt>
            <dd className="break-all text-ink">{props.deckInfo.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-muted">Created</dt>
            <dd className="text-ink">{formatDate(props.deckInfo.createdAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-muted">Updated</dt>
            <dd className="text-ink">{formatDate(props.deckInfo.updatedAt)}</dd>
          </div>
        </dl>
      </details>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button variant="quiet" type="button" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
};
