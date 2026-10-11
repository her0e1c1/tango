import type { TFunction } from "i18next";
import type * as React from "react";
import { useId } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { type UseFormReturn, useFormState } from "react-hook-form";

import { Button } from "@/shared/ui/button";

export interface DeckFormFields {
  name: string;
  category: string;
}

interface CommonDeckFormProps {
  categories: readonly string[];
  form: UseFormReturn<DeckFormFields>;
  saveDisabled?: boolean;
  onCancel: () => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void | Promise<void>;
}

interface DeckCreateFormProps extends CommonDeckFormProps {
  mode: "create";
}

interface DeckEditFormProps extends CommonDeckFormProps {
  mode: "edit";
  deckName: string;
  deckInfo: { id: string; createdAt: number; updatedAt: number };
  afterForm?: React.ReactNode;
}

type DeckFormProps = DeckCreateFormProps | DeckEditFormProps;

const formatDate = (timestamp: number, locale: string): string => new Date(timestamp).toLocaleDateString(locale);

interface DeckFormPresentation {
  isSaving: boolean;
  title: string;
}

const getDeckFormPresentation = (
  props: DeckFormProps,
  formIsSubmitting: boolean,
  t: TFunction
): DeckFormPresentation => ({
  isSaving: formIsSubmitting,
  title: props.mode === "create" ? t("deckForm.create.title") : props.deckName,
});

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
      <form noValidate onSubmit={(event) => void props.onSubmit(event)}>
        <fieldset className="min-w-0 space-y-7 p-5 md:p-6" disabled={presentation.isSaving}>
          <BasicInformationSection
            categories={props.categories}
            error={
              formState.errors.name === undefined
                ? undefined
                : t(formState.errors.name.type === "too_small" ? "validation.required.deckName" : "validation.invalid")
            }
            form={props.form}
            idPrefix={idPrefix}
          />
          {props.mode === "edit" ? <DeckInformation deckInfo={props.deckInfo} /> : null}
        </fieldset>
        <div className="border-t border-border p-4 md:px-6">
          <Button
            className="min-h-12 w-full"
            variant="primary"
            type="submit"
            disabled={Boolean(props.saveDisabled)}
            loading={presentation.isSaving}
          >
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
