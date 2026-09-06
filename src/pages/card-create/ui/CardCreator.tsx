import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { type UseFormReturn, useFormState } from "react-hook-form";

import { CardFields, type CardFormFields } from "@/features/card-form";
import { Button } from "@/shared/ui/button";

export interface CardCreatorProps {
  categories: readonly string[];
  deckName: string;
  form: UseFormReturn<CardFormFields>;
  onCancel: () => void;
  onSubmit: (values: CardFormFields) => Promise<void>;
}

export const CardCreator: React.FC<CardCreatorProps> = ({ categories, deckName, form, onCancel, onSubmit }) => {
  const { t } = useTranslation();
  const formState = useFormState({ control: form.control });

  return (
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
      <header className="mb-5">
        <button
          type="button"
          disabled={formState.isSubmitting}
          className="mb-1 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
          onClick={onCancel}
        >
          <AiOutlineArrowLeft aria-hidden="true" />
          {t("cardForm.back")}
        </button>
        <h1 className="mt-1 break-words text-title font-bold text-ink">{t("cardForm.create.title")}</h1>
        <p className="mt-2 text-caption text-ink-muted">{t("cardForm.create.description", { deckName })}</p>
      </header>
      {/* Fixed dialogs from CardFields must not receive the sibling margins added by space-y utilities. */}
      {/* Keep the DOM callback void for no-misused-promises; RHF still awaits the validated save callback. */}
      <form className="flex w-full flex-col gap-4" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <CardFields categories={categories} form={form} />
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="quiet" type="button" onClick={onCancel}>
            {t("cardForm.actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={formState.isSubmitting}>
            <span>{t(formState.isSubmitting ? "cardForm.actions.creating" : "cardForm.actions.create")}</span>
          </Button>
        </div>
      </form>
    </section>
  );
};
