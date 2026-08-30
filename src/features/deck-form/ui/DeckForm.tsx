import type * as React from "react";
import { useId } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { type UseFormReturn, useFormState } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { Form, FormItem, Input, Select, Switch } from "@/shared/ui/forms";

export interface DeckFormFields {
  name: string;
  category: string;
  url?: string | undefined;
  convertToBr: boolean;
  localMode?: boolean | undefined;
}

interface CommonDeckFormProps {
  categories: readonly string[];
  form: UseFormReturn<DeckFormFields>;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

interface DeckCreateFormProps extends CommonDeckFormProps {
  mode: "create";
  isLocalModeLocked: boolean;
}

interface DeckEditFormProps extends CommonDeckFormProps {
  mode: "edit";
  deckName: string;
  deckInfo: { id: string; createdAt: number; updatedAt: number };
  isLocalOnly: boolean;
  isSaving: boolean;
  afterForm?: React.ReactNode;
}

type DeckFormProps = DeckCreateFormProps | DeckEditFormProps;

const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleDateString();

interface DeckFormPresentation {
  autoFocusName: boolean;
  description: string;
  eyebrow: string;
  isSaving: boolean;
  localModeDisabled: boolean;
  localModeHelp: string;
  title: string;
}

const getDeckFormPresentation = (props: DeckFormProps, formIsSubmitting: boolean): DeckFormPresentation => {
  if (props.mode === "create") {
    return {
      autoFocusName: true,
      description: "Start with an empty deck.",
      eyebrow: "Deck creator",
      isSaving: formIsSubmitting,
      localModeDisabled: props.isLocalModeLocked,
      localModeHelp: "Keep this deck and its cards on this device.",
      title: "Create deck",
    };
  }

  return {
    autoFocusName: false,
    description: "Manage this deck’s information, import source, and formatting.",
    eyebrow: "Deck settings",
    isSaving: props.isSaving || formIsSubmitting,
    localModeDisabled: !props.isLocalOnly,
    localModeHelp: props.isLocalOnly
      ? "Turn off to save this deck and its cards to Firestore. This change cannot be undone."
      : "This deck and its cards are saved to Firestore.",
    title: props.deckName,
  };
};

const DeckFormHeader = ({
  mode,
  onCancel,
  presentation,
}: {
  mode: DeckFormProps["mode"];
  onCancel: () => void;
  presentation: DeckFormPresentation;
}) => (
  <header className="mb-section-gap">
    <button
      type="button"
      disabled={mode === "create" && presentation.isSaving}
      className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
      onClick={onCancel}
    >
      <AiOutlineArrowLeft aria-hidden="true" />
      Back to decks
    </button>
    <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">{presentation.eyebrow}</p>
    <h1 className={`mt-1 break-words text-display font-bold text-ink${mode === "edit" ? " line-clamp-3" : ""}`}>
      {presentation.title}
    </h1>
    <p className="mt-2 text-body text-ink-muted">{presentation.description}</p>
  </header>
);

const StorageSection = ({
  disabled,
  form,
  headingId,
  help,
}: {
  disabled: boolean;
  form: UseFormReturn<DeckFormFields>;
  headingId: string;
  help: string;
}) => (
  <section aria-labelledby={headingId} className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
    <div>
      <h2 id={headingId} className="text-title font-semibold text-ink">
        Storage
      </h2>
      <p className="mt-1 text-caption text-ink-muted">Choose whether this deck stays on this device.</p>
    </div>
    <FormItem label="Local only" help={help}>
      <Switch {...form.register("localMode")} aria-label="Local only" disabled={disabled} />
    </FormItem>
  </section>
);

const BasicInformationSection = ({
  autoFocusName,
  categories,
  categoryInputId,
  error,
  form,
  headingId,
  nameErrorId,
  nameInputId,
}: {
  autoFocusName: boolean;
  categories: readonly string[];
  categoryInputId: string;
  error: string | undefined;
  form: UseFormReturn<DeckFormFields>;
  headingId: string;
  nameErrorId: string;
  nameInputId: string;
}) => (
  <section aria-labelledby={headingId} className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
    <div>
      <h2 id={headingId} className="text-title font-semibold text-ink">
        Basic information
      </h2>
      <p className="mt-1 text-caption text-ink-muted">Name and organize this deck.</p>
    </div>
    <FormItem col label="Name" inputId={nameInputId} errorId={nameErrorId} {...(error === undefined ? {} : { error })}>
      <Input
        {...form.register("name")}
        id={nameInputId}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={error === undefined ? undefined : nameErrorId}
        autoFocus={autoFocusName}
      />
    </FormItem>
    <FormItem col label="Category" inputId={categoryInputId}>
      <Select
        id={categoryInputId}
        empty
        {...form.register("category")}
        options={categories.map((category) => ({ label: category, value: category }))}
      />
    </FormItem>
  </section>
);

const ImportFormattingSection = ({
  error,
  form,
  headingId,
  urlErrorId,
  urlInputId,
}: {
  error: string | undefined;
  form: UseFormReturn<DeckFormFields>;
  headingId: string;
  urlErrorId: string;
  urlInputId: string;
}) => (
  <section aria-labelledby={headingId} className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
    <div>
      <h2 id={headingId} className="text-title font-semibold text-ink">
        Import &amp; formatting
      </h2>
      <p className="mt-1 text-caption text-ink-muted">Control the source and how imported text is displayed.</p>
    </div>
    <FormItem
      col
      label="Source URL"
      inputId={urlInputId}
      errorId={urlErrorId}
      {...(error === undefined ? {} : { error })}
    >
      <Input
        {...form.register("url", {
          // Keep optional Deck URLs absent even though an empty HTML input reports an empty string.
          setValueAs: (value: unknown) => (value === "" ? undefined : value),
        })}
        id={urlInputId}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={error === undefined ? undefined : urlErrorId}
      />
    </FormItem>
    <FormItem label="Convert line breaks" help="Convert two line breaks to one <br />.">
      <Switch {...form.register("convertToBr")} aria-label="Convert line breaks" />
    </FormItem>
  </section>
);

const DeckInformation = ({ deckInfo }: Pick<DeckEditFormProps, "deckInfo">) => (
  <details className="rounded-surface border border-border bg-surface-muted p-4">
    <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">Deck information</summary>
    <dl className="mt-4 grid gap-3 text-caption">
      <div className="min-w-0">
        <dt className="font-medium text-ink-muted">ID</dt>
        <dd className="break-all text-ink">{deckInfo.id}</dd>
      </div>
      <div>
        <dt className="font-medium text-ink-muted">Created</dt>
        <dd className="text-ink">{formatDate(deckInfo.createdAt)}</dd>
      </div>
      <div>
        <dt className="font-medium text-ink-muted">Updated</dt>
        <dd className="text-ink">{formatDate(deckInfo.updatedAt)}</dd>
      </div>
    </dl>
  </details>
);

const DeckFormActions = ({
  isSaving,
  mode,
  onCancel,
}: {
  isSaving: boolean;
  mode: DeckFormProps["mode"];
  onCancel: () => void;
}) => (
  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
    <Button variant="quiet" type="button" disabled={mode === "create" && isSaving} onClick={onCancel}>
      Cancel
    </Button>
    {mode === "create" ? (
      <Button variant="primary" type="submit" loading={isSaving}>
        Create deck
      </Button>
    ) : (
      <Button variant="primary" type="submit" disabled={isSaving}>
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    )}
  </div>
);

export const DeckForm: React.FC<DeckFormProps> = (props) => {
  const formState = useFormState({ control: props.form.control });
  const idPrefix = useId();
  const nameInputId = `${idPrefix}-deck-name`;
  const urlInputId = `${idPrefix}-deck-url`;
  const presentation = getDeckFormPresentation(props, formState.isSubmitting);

  return (
    <section className="mx-auto w-full max-w-reading overflow-hidden rounded-surface border border-border bg-surface p-4 md:p-6">
      <DeckFormHeader mode={props.mode} onCancel={props.onCancel} presentation={presentation} />
      <Form onSubmit={props.onSubmit}>
        <StorageSection
          disabled={presentation.localModeDisabled}
          form={props.form}
          headingId={`${idPrefix}-deck-storage-heading`}
          help={presentation.localModeHelp}
        />
        <BasicInformationSection
          autoFocusName={presentation.autoFocusName}
          categories={props.categories}
          categoryInputId={`${idPrefix}-deck-category`}
          error={formState.errors.name?.message}
          form={props.form}
          headingId={`${idPrefix}-deck-basic-heading`}
          nameErrorId={`${nameInputId}-error`}
          nameInputId={nameInputId}
        />
        <ImportFormattingSection
          error={formState.errors.url?.message}
          form={props.form}
          headingId={`${idPrefix}-deck-import-heading`}
          urlErrorId={`${urlInputId}-error`}
          urlInputId={urlInputId}
        />
        {props.mode === "edit" ? <DeckInformation deckInfo={props.deckInfo} /> : null}
        <DeckFormActions isSaving={presentation.isSaving} mode={props.mode} onCancel={props.onCancel} />
      </Form>
      {props.mode === "edit" ? props.afterForm : null}
    </section>
  );
};
