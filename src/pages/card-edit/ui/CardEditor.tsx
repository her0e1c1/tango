import type * as React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { type UseFormReturn, useFormState } from "react-hook-form";

import type { CardId } from "@/entities/card";
import { CardFields, type CardFormFields } from "@/features/card-form";
import { Button } from "@/shared/ui/button";

export interface CardEditorProps {
  cardInfo: { uniqueKey: string; id: CardId; createdAt?: number; lastSeenAt?: number };
  categories: readonly string[];
  form: UseFormReturn<CardFormFields>;
  onCancel: () => void;
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;
}

const formatDate = (timestamp: number, locale: string): string => new Date(timestamp).toLocaleDateString(locale);

export const CardEditor: React.FC<CardEditorProps> = ({ cardInfo, categories, form, onCancel, onSubmit }) => {
  const { isSubmitting: isSaving } = useFormState({ control: form.control });
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  return (
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
      <header className="mb-5">
        <button
          type="button"
          disabled={isSaving}
          className="mb-1 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
          onClick={onCancel}
        >
          <AiOutlineArrowLeft aria-hidden="true" />
          {t("cardForm.back")}
        </button>
        <h1 className="mt-1 break-words text-title font-bold text-ink">{t("cardForm.edit.title")}</h1>
      </header>
      <form className="w-full space-y-4" onSubmit={onSubmit}>
        <fieldset className="contents" disabled={isSaving}>
          <CardFields categories={categories} form={form} />
          <details className="border-t border-border text-caption">
            <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">
              {t("cardForm.information.title")}
            </summary>
            <dl className="mt-4 grid gap-3 text-caption">
              <div className="min-w-0">
                <dt className="font-medium text-ink-muted">{t("cardForm.information.uniqueKey")}</dt>
                <dd className="break-all text-ink">{cardInfo.uniqueKey}</dd>
              </div>
              <div className="min-w-0">
                <dt className="font-medium text-ink-muted">{t("cardForm.information.id")}</dt>
                <dd className="break-all text-ink">{cardInfo.id}</dd>
              </div>
              {cardInfo.createdAt !== undefined && (
                <div>
                  <dt className="font-medium text-ink-muted">{t("cardForm.information.created")}</dt>
                  <dd className="text-ink">{formatDate(cardInfo.createdAt, locale)}</dd>
                </div>
              )}
              {cardInfo.lastSeenAt !== undefined && (
                <div>
                  <dt className="font-medium text-ink-muted">{t("cardForm.information.lastSeen")}</dt>
                  <dd className="text-ink">{formatDate(cardInfo.lastSeenAt, locale)}</dd>
                </div>
              )}
            </dl>
          </details>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="quiet" type="button" disabled={isSaving} onClick={onCancel}>
            {t("cardForm.actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            <span>{t(isSaving ? "cardForm.actions.saving" : "cardForm.actions.save")}</span>
          </Button>
        </div>
      </form>
    </section>
  );
};
