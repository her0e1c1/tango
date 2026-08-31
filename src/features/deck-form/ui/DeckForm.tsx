import type { TFunction } from "i18next";
import type * as React from "react";
import { useId } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useTranslation } from "react-i18next";
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

const formatDate = (timestamp: number, locale: string): string => new Date(timestamp).toLocaleDateString(locale);

interface DeckFormPresentation {
  autoFocusName: boolean;
  description: string;
  eyebrow: string;
  isSaving: boolean;
  localModeDisabled: boolean;
  localModeHelp: string;
  title: string;
}

const getDeckFormPresentation = (
  props: DeckFormProps,
  formIsSubmitting: boolean,
  t: TFunction
): DeckFormPresentation => {
  if (props.mode === "create") {
    return {
      autoFocusName: true,
      description: t("deckForm.create.description"),
      eyebrow: t("deckForm.create.eyebrow"),
      isSaving: formIsSubmitting,
      localModeDisabled: props.isLocalModeLocked,
      localModeHelp: t("deckForm.create.localModeHelp"),
      title: t("deckForm.create.title"),
    };
  }

  return {
    autoFocusName: false,
    description: t("deckForm.edit.description"),
    eyebrow: t("deckForm.edit.eyebrow"),
    isSaving: props.isSaving || formIsSubmitting,
    localModeDisabled: !props.isLocalOnly,
    localModeHelp: props.isLocalOnly ? t("deckForm.edit.localModeHelp") : t("deckForm.edit.remoteModeHelp"),
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
}) => {
  const { t } = useTranslation();

  return (
    <header className="mb-section-gap">
      <button
        type="button"
        disabled={mode === "create" && presentation.isSaving}
        className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
        onClick={onCancel}
      >
        <AiOutlineArrowLeft aria-hidden="true" />
        {t("deckForm.back")}
      </button>
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">{presentation.eyebrow}</p>
      <h1 className={`mt-1 break-words text-display font-bold text-ink${mode === "edit" ? " line-clamp-3" : ""}`}>
        {presentation.title}
      </h1>
      <p className="mt-2 text-body text-ink-muted">{presentation.description}</p>
    </header>
  );
};

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
}) => {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
    >
      <div>
        <h2 id={headingId} className="text-title font-semibold text-ink">
          {t("deckForm.storage.title")}
        </h2>
        <p className="mt-1 text-caption text-ink-muted">{t("deckForm.storage.description")}</p>
      </div>
      <FormItem label={t("deckForm.storage.localOnly")} help={help}>
        <Switch {...form.register("localMode")} aria-label={t("deckForm.storage.localOnly")} disabled={disabled} />
      </FormItem>
    </section>
  );
};

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
}) => {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
    >
      <div>
        <h2 id={headingId} className="text-title font-semibold text-ink">
          {t("deckForm.basic.title")}
        </h2>
        <p className="mt-1 text-caption text-ink-muted">{t("deckForm.basic.description")}</p>
      </div>
      <FormItem
        col
        label={t("deckForm.basic.name")}
        inputId={nameInputId}
        errorId={nameErrorId}
        {...(error === undefined ? {} : { error })}
      >
        <Input
          {...form.register("name")}
          id={nameInputId}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error === undefined ? undefined : nameErrorId}
          autoFocus={autoFocusName}
        />
      </FormItem>
      <FormItem col label={t("deckForm.basic.category")} inputId={categoryInputId}>
        <Select
          id={categoryInputId}
          empty
          {...form.register("category")}
          options={categories.map((category) => ({ label: category, value: category }))}
        />
      </FormItem>
    </section>
  );
};

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
}) => {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
    >
      <div>
        <h2 id={headingId} className="text-title font-semibold text-ink">
          {t("deckForm.importFormatting.title")}
        </h2>
        <p className="mt-1 text-caption text-ink-muted">{t("deckForm.importFormatting.description")}</p>
      </div>
      <FormItem
        col
        label={t("deckForm.importFormatting.sourceUrl")}
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
      <FormItem
        label={t("deckForm.importFormatting.convertLineBreaks")}
        help={t("deckForm.importFormatting.convertLineBreaksHelp")}
      >
        <Switch {...form.register("convertToBr")} aria-label={t("deckForm.importFormatting.convertLineBreaks")} />
      </FormItem>
    </section>
  );
};

const DeckInformation = ({ deckInfo }: Pick<DeckEditFormProps, "deckInfo">) => {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  return (
    <details className="rounded-surface border border-border bg-surface-muted p-4">
      <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">
        {t("deckForm.information.title")}
      </summary>
      <dl className="mt-4 grid gap-3 text-caption">
        <div className="min-w-0">
          <dt className="font-medium text-ink-muted">{t("deckForm.information.id")}</dt>
          <dd className="break-all text-ink">{deckInfo.id}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink-muted">{t("deckForm.information.created")}</dt>
          <dd className="text-ink">{formatDate(deckInfo.createdAt, locale)}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink-muted">{t("deckForm.information.updated")}</dt>
          <dd className="text-ink">{formatDate(deckInfo.updatedAt, locale)}</dd>
        </div>
      </dl>
    </details>
  );
};

const DeckFormActions = ({
  isSaving,
  mode,
  onCancel,
}: {
  isSaving: boolean;
  mode: DeckFormProps["mode"];
  onCancel: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
      <Button variant="quiet" type="button" disabled={mode === "create" && isSaving} onClick={onCancel}>
        {t("deckForm.actions.cancel")}
      </Button>
      {mode === "create" ? (
        <Button variant="primary" type="submit" loading={isSaving}>
          {t("deckForm.actions.create")}
        </Button>
      ) : (
        <Button variant="primary" type="submit" disabled={isSaving}>
          {t(isSaving ? "deckForm.actions.saving" : "deckForm.actions.save")}
        </Button>
      )}
    </div>
  );
};

export const DeckForm: React.FC<DeckFormProps> = (props) => {
  const { t } = useTranslation();
  const formState = useFormState({ control: props.form.control });
  const idPrefix = useId();
  const nameInputId = `${idPrefix}-deck-name`;
  const urlInputId = `${idPrefix}-deck-url`;
  const presentation = getDeckFormPresentation(props, formState.isSubmitting, t);

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
