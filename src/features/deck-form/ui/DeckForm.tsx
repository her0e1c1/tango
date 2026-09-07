import type { TFunction } from "i18next";
import type * as React from "react";
import { useId, useLayoutEffect, useRef } from "react";
import { AiOutlineArrowLeft, AiOutlineCloud, AiOutlineDown, AiOutlineMobile } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { Controller, type UseFormReturn, useFormState } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { FormItem, Input, Switch } from "@/shared/ui/forms";

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
  isSaving: boolean;
  localModeDisabled: boolean;
  localModeHelp: string | undefined;
  title: string;
}

const getDeckFormPresentation = (
  props: DeckFormProps,
  formIsSubmitting: boolean,
  t: TFunction
): DeckFormPresentation => {
  if (props.mode === "create") {
    return {
      isSaving: formIsSubmitting,
      localModeDisabled: props.isLocalModeLocked,
      localModeHelp: undefined,
      title: t("deckForm.create.title"),
    };
  }

  return {
    isSaving: props.isSaving || formIsSubmitting,
    localModeDisabled: !props.isLocalOnly,
    localModeHelp: props.isLocalOnly ? t("deckForm.edit.localModeHelp") : t("deckForm.edit.remoteModeHelp"),
    title: props.deckName,
  };
};

const StorageSection = ({
  disabled,
  form,
  idPrefix,
  help,
}: {
  disabled: boolean;
  form: UseFormReturn<DeckFormFields>;
  idPrefix: string;
  help: string | undefined;
}) => {
  const { t } = useTranslation();
  const options = [
    {
      localMode: false,
      label: t("deckForm.storage.cloud"),
      description: t("deckForm.storage.cloudHelp"),
      Icon: AiOutlineCloud,
    },
    {
      localMode: true,
      label: t("deckForm.storage.localOnly"),
      description: t("deckForm.storage.localHelp"),
      Icon: AiOutlineMobile,
    },
  ];

  return (
    <fieldset className="min-w-0" disabled={disabled} aria-describedby={help ? `${idPrefix}-help` : undefined}>
      <legend className="mb-3 text-caption font-medium text-ink">{t("deckForm.storage.title")}</legend>
      {/* Persistence branches on this boolean; native radio strings such as "false" must not enter form state. */}
      <Controller
        control={form.control}
        name="localMode"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            {options.map(({ localMode, label, description, Icon }) => (
              <label
                key={String(localMode)}
                className="flex min-w-0 cursor-pointer flex-col gap-2 rounded-control border border-border bg-surface p-3 has-checked:border-accent-primary has-checked:bg-accent-primary/5 has-disabled:cursor-not-allowed has-disabled:opacity-60"
              >
                <span className="flex items-center justify-between gap-2">
                  <Icon aria-hidden="true" className="text-ink" />
                  <input
                    ref={localMode ? undefined : field.ref}
                    type="radio"
                    name={field.name}
                    value={String(localMode)}
                    checked={(field.value === true) === localMode}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(localMode)}
                    aria-label={label}
                    aria-describedby={`${idPrefix}-${String(localMode)}-description`}
                    className="size-4 shrink-0 accent-accent-primary"
                  />
                </span>
                <span className="break-words text-caption text-ink">
                  {label}
                  <span
                    id={`${idPrefix}-${String(localMode)}-description`}
                    className="mt-1 block text-xs text-ink-muted"
                  >
                    {description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      />
      {help !== undefined && (
        <p id={`${idPrefix}-help`} className="mt-3 text-caption text-ink-muted">
          {help}
        </p>
      )}
    </fieldset>
  );
};

const BasicInformationSection = ({
  categories,
  error,
  form,
  idPrefix,
}: {
  categories: readonly string[];
  error: string | undefined;
  form: UseFormReturn<DeckFormFields>;
  idPrefix: string;
}) => {
  const { t } = useTranslation();
  const nameInputId = `${idPrefix}-name`;
  const nameErrorId = `${nameInputId}-error`;

  return (
    <div className="space-y-7">
      <div>
        <div className="mb-2 flex items-baseline gap-2">
          <label htmlFor={nameInputId} className="text-caption font-medium text-ink">
            {t("deckForm.basic.name")}
          </label>
          <span className="text-xs text-ink-muted">{t("deckForm.basic.required")}</span>
        </div>
        <input
          {...form.register("name")}
          id={nameInputId}
          aria-required="true"
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error === undefined ? undefined : nameErrorId}
          className="min-h-14 w-full min-w-0 rounded-none border-0 border-b border-border bg-transparent px-0 py-3 text-2xl text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:text-ink-muted"
        />
        {error !== undefined && (
          <p id={nameErrorId} className="mt-2 text-caption text-danger">
            {error}
          </p>
        )}
      </div>
      <label className="grid min-h-14 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 border-b border-border text-caption text-ink">
        <span className="font-medium">{t("deckForm.basic.category")}</span>
        <select
          {...form.register("category")}
          className="min-h-touch w-full min-w-0 rounded-control border-0 bg-surface py-2 text-base text-ink disabled:cursor-not-allowed disabled:text-ink-muted"
        >
          <option value="">{t("deckForm.basic.defaultFormat")}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "math"
                ? t("deckForm.basic.mathFormat")
                : category === "raw"
                  ? t("deckForm.basic.rawFormat")
                  : category}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

const ImportFormattingSection = ({
  error,
  hasNameError,
  submitCount,
  form,
  idPrefix,
}: {
  error: string | undefined;
  hasNameError: boolean;
  submitCount: number;
  form: UseFormReturn<DeckFormFields>;
  idPrefix: string;
}) => {
  const { t } = useTranslation();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const previousSubmitCount = useRef(submitCount);
  const urlInputId = `${idPrefix}-url`;
  const urlErrorId = `${urlInputId}-error`;

  useLayoutEffect(() => {
    const submitted = previousSubmitCount.current !== submitCount;
    previousSubmitCount.current = submitCount;
    // Reveal errors on every submit, but do not move focus while the user is correcting another field.
    if (error !== undefined && detailsRef.current !== null) {
      detailsRef.current.open = true;
      if (submitted && !hasNameError) form.setFocus("url");
    }
  }, [error, hasNameError, submitCount, form]);

  return (
    <details ref={detailsRef} className="group">
      <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 text-caption text-ink [&::-webkit-details-marker]:hidden">
        <span className="flex flex-wrap items-baseline gap-2">
          {t("deckForm.importFormatting.title")}
          <span className="text-xs text-ink-muted">{t("deckForm.importFormatting.description")}</span>
        </span>
        <AiOutlineDown aria-hidden="true" className="shrink-0 group-open:rotate-180" />
      </summary>
      <div className="space-y-5 pt-4">
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
            type="url"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
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
      </div>
    </details>
  );
};

const DeckInformation = ({ deckInfo }: Pick<DeckEditFormProps, "deckInfo">) => {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  return (
    <details className="border-t border-border pt-3">
      <summary className="flex min-h-touch cursor-pointer items-center text-caption font-medium text-ink">
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

export const DeckForm: React.FC<DeckFormProps> = (props) => {
  const { t } = useTranslation();
  const formState = useFormState({ control: props.form.control });
  const idPrefix = useId();
  const presentation = getDeckFormPresentation(props, formState.isSubmitting, t);

  return (
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface">
      <header className="flex items-center gap-3 border-b border-border p-3">
        <button
          type="button"
          disabled={presentation.isSaving}
          aria-label={t("deckForm.back")}
          className="flex size-touch shrink-0 items-center justify-center rounded-control text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={props.onCancel}
        >
          <AiOutlineArrowLeft aria-hidden="true" />
        </button>
        <h1 className="line-clamp-2 min-w-0 break-words text-base font-medium text-ink">{presentation.title}</h1>
      </header>
      <form noValidate onSubmit={props.onSubmit}>
        <fieldset className="min-w-0 space-y-7 p-5 md:p-6" disabled={presentation.isSaving}>
          <BasicInformationSection
            categories={props.categories}
            error={formState.errors.name?.message}
            form={props.form}
            idPrefix={idPrefix}
          />
          <StorageSection
            disabled={presentation.localModeDisabled}
            form={props.form}
            idPrefix={`${idPrefix}-storage`}
            help={presentation.localModeHelp}
          />
          <ImportFormattingSection
            error={formState.errors.url?.message}
            hasNameError={formState.errors.name !== undefined}
            submitCount={formState.submitCount}
            form={props.form}
            idPrefix={idPrefix}
          />
          {props.mode === "edit" ? <DeckInformation deckInfo={props.deckInfo} /> : null}
        </fieldset>
        <div className="border-t border-border p-4 md:px-6">
          <Button className="min-h-12 w-full" variant="primary" type="submit" loading={presentation.isSaving}>
            {t(
              props.mode === "create"
                ? "deckForm.actions.create"
                : presentation.isSaving
                  ? "deckForm.actions.saving"
                  : "deckForm.actions.save"
            )}
          </Button>
        </div>
      </form>
      {props.mode === "edit" && props.afterForm ? (
        <div className="px-5 pb-5 md:px-6 md:pb-6">{props.afterForm}</div>
      ) : null}
    </section>
  );
};
