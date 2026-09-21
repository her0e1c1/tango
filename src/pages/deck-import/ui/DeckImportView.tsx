import type { CsvDiagnostic } from "../lib/cardCsv";
import { importFailureKey } from "../lib/importFailure";
import { formatCsvDiagnostic } from "./formatCsvDiagnostic";
import * as React from "react";
import { AiOutlineCheckCircle, AiOutlineCloudDownload, AiOutlineFileText } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { Code, MathContent } from "@/shared/ui/content";
import { Upload } from "@/shared/ui/forms";
import type { DeckImportExampleId } from "../lib/examples";

interface PreviewCard {
  frontText: string;
  backText: string;
  tags: readonly string[];
  uniqueKey: string;
  contentCategory?: string;
}
interface DeckImportPreview {
  deckName: string;
  analysis: {
    rows: readonly { rowNumber: number; card: PreviewCard }[];
    skippedRows: readonly unknown[];
    issues: readonly { rowNumber?: number; diagnostic: CsvDiagnostic; context?: string }[];
    invalidCount: number;
  };
}

export interface DeckImportViewProps {
  onChange?: (file: File) => void;
  onChooseAgain?: () => void;
  onSelectExample?: (id: DeckImportExampleId) => void;
  onDownloadExample?: (id: DeckImportExampleId) => void;
  onImport?: () => void;
  examples: readonly { id: DeckImportExampleId; fileName: string; cards: readonly PreviewCard[]; csv: string }[];
  initialExampleId?: DeckImportExampleId;
  dark?: boolean;
  validating?: boolean;
  pending?: boolean;
  preview?: DeckImportPreview | undefined;
  previewError?: unknown;
}

const panelClass = "min-w-0 space-y-4 rounded-surface border border-border bg-surface p-4 sm:p-6";
const summaryClass = "min-h-touch cursor-pointer content-center rounded-control text-caption text-accent-primary";

const PreviewError = ({ error }: { error: unknown }) => {
  const { t } = useTranslation();
  if (error == null) return null;
  return (
    <section role="alert" className="rounded-surface border border-danger bg-surface-muted p-4 text-ink">
      <h2 className="font-semibold">{t("deckImport.errors.previewTitle")}</h2>
      <p className="mt-1 break-words text-caption text-ink-muted">
        {t(importFailureKey(error) ?? "deckImport.errors.previewFailure")}
      </p>
      <p className="mt-2 text-caption text-ink-muted">{t("deckImport.errors.retry")}</p>
    </section>
  );
};

const CardContent = ({
  text,
  category = "",
  dark,
  front = false,
}: {
  text: string;
  category?: string | undefined;
  dark: boolean;
  front?: boolean;
}) => {
  if (category === "math") return <MathContent text={text} />;
  if (!front && category) return <Code text={text} category={category} dark={dark} />;
  return <p className="whitespace-pre-wrap break-words">{text}</p>;
};

const CardExamples = ({ cards, dark, limit = 3 }: { cards: readonly PreviewCard[]; dark: boolean; limit?: number }) => {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <ul className="divide-y divide-border border-y border-border">
        {cards.slice(0, limit).map((card) => (
          <li key={card.uniqueKey} className="grid min-w-0 gap-3 py-4 sm:grid-cols-[1fr_1.5fr] sm:gap-5">
            <div className="min-w-0">
              <p className="mb-1 text-caption text-ink-muted">{t("deckImport.preview.table.front")}</p>
              <CardContent text={card.frontText} category={card.contentCategory} dark={dark} front />
              {card.tags.length > 0 && (
                <p className="mt-2 break-words text-caption text-ink-muted">{card.tags.join(", ")}</p>
              )}
              <p className="mt-2 break-all text-caption text-ink-muted">uniqueKey: {card.uniqueKey}</p>
            </div>
            <div className="min-w-0 rounded-control bg-canvas p-3">
              <p className="mb-1 text-caption text-ink-muted">{t("deckImport.preview.table.back")}</p>
              {card.backText.length > 300 ? (
                <details>
                  <summary className={summaryClass}>{t("deckImport.preview.showAnswer")}</summary>
                  <CardContent text={card.backText} category={card.contentCategory} dark={dark} />
                </details>
              ) : (
                <CardContent text={card.backText} category={card.contentCategory} dark={dark} />
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-ink-muted">
        {t("deckImport.sample.shown", { count: cards.length, shown: Math.min(cards.length, limit) })}
      </p>
    </div>
  );
};

const ImportPreview = ({
  preview,
  busy,
  pending,
  dark,
  onImport,
}: {
  preview: DeckImportPreview;
  busy: boolean;
  pending: boolean;
  dark: boolean;
  onImport: (() => void) | undefined;
}) => {
  const { t } = useTranslation();
  const { analysis } = preview;
  const canImport = analysis.rows.length > 0 && analysis.invalidCount === 0 && !busy;
  return (
    <section aria-labelledby="import-preview-heading" className={panelClass}>
      <h2 id="import-preview-heading" className="flex items-center gap-3 text-title font-semibold">
        <span aria-hidden="true" className="text-caption text-accent-primary">
          2
        </span>
        {t("deckImport.preview.title")}
      </h2>
      <p className="break-words text-caption text-ink-muted">
        {t("deckImport.preview.deck")} <strong className="text-ink">{preview.deckName}</strong>
      </p>
      {analysis.invalidCount === 0 && analysis.rows.length > 0 && (
        <p className="flex items-center gap-2 font-semibold">
          <AiOutlineCheckCircle aria-hidden="true" className="shrink-0 text-success" />
          {t("deckImport.preview.ready", { count: analysis.rows.length })}
        </p>
      )}
      <ul
        aria-label={t("deckImport.preview.validation")}
        className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted"
      >
        <li>{t("deckImport.preview.valid", { count: analysis.rows.length })}</li>
        <li>{t("deckImport.preview.skipped", { count: analysis.skippedRows.length })}</li>
        <li>{t("deckImport.preview.invalid", { count: analysis.invalidCount })}</li>
      </ul>
      {analysis.issues.length > 0 && (
        <div role="alert" className="rounded-control border border-danger bg-surface-muted p-3 text-caption">
          <h3 className="font-semibold">{t("deckImport.preview.issuesTitle")}</h3>
          <ul className="mt-2 space-y-2">
            {analysis.issues.map((issue, index) => (
              <li key={`${String(issue.rowNumber ?? "file")}-${String(index)}`}>
                <strong>
                  {issue.rowNumber == null
                    ? t("deckImport.preview.file")
                    : t("deckImport.preview.row", { rowNumber: issue.rowNumber })}
                  :
                </strong>{" "}
                {formatCsvDiagnostic(issue.diagnostic, t)}
                {issue.context != null && (
                  <code className="mt-1 block break-words whitespace-pre-wrap text-ink-muted">{issue.context}</code>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3">{t("deckImport.preview.correctedFile")}</p>
        </div>
      )}
      {analysis.rows.length > 0 && <CardExamples cards={analysis.rows.map((row) => row.card)} dark={dark} limit={10} />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-caption text-ink-muted">{t("deckImport.preview.newDeck")}</p>
        </div>
        <Button
          variant="primary"
          disabled={!canImport}
          loading={pending}
          {...(onImport === undefined ? {} : { onClick: onImport })}
        >
          {t("deckImport.preview.import", { count: analysis.rows.length })}
        </Button>
      </div>
    </section>
  );
};

export const DeckImportView: React.FC<DeckImportViewProps> = (props) => {
  const { t } = useTranslation();
  const [exampleId, setExampleId] = React.useState(props.initialExampleId ?? "basic");
  const busy = Boolean(props.pending || props.validating);
  const example = props.examples.find((candidate) => candidate.id === exampleId);
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 text-ink">
      <div>
        <h1 className="break-words text-title font-semibold">{t("deckImport.title")}</h1>
        <p className="mt-2 text-ink-muted">{t("deckImport.description")}</p>
      </div>
      <PreviewError error={props.previewError} />
      <section className={panelClass}>
        <h2 className="flex items-center gap-3 text-title font-semibold">
          <span aria-hidden="true" className="text-caption text-accent-primary">
            {props.preview ? "✓" : "1"}
          </span>
          {t("deckImport.file.title")}
        </h2>
        {props.preview ? (
          <div className="flex flex-wrap items-center gap-3 rounded-control border border-border p-3">
            <AiOutlineFileText aria-hidden="true" className="shrink-0 text-accent-primary" />
            <div className="min-w-0 flex-1">
              <strong className="break-words">{props.preview.deckName}</strong>
              <p className="text-caption text-ink-muted">{t("deckImport.file.nameHelp")}</p>
            </div>
            <Button variant="quiet" disabled={busy} onClick={() => props.onChooseAgain?.()}>
              {t("deckImport.file.chooseAgain")}
            </Button>
            <label className="relative min-h-touch cursor-pointer content-center rounded-control px-2 text-caption text-accent-primary underline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus has-[:focus-visible]:outline-offset-2">
              {t("deckImport.file.replace")}
              <input
                type="file"
                accept=".csv"
                aria-label={t("deckImport.uploadPrompt")}
                disabled={busy}
                className="absolute inset-0 h-full w-full opacity-0 disabled:cursor-not-allowed"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) props.onChange?.(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <Upload
            className="max-w-none"
            disabled={busy}
            {...(props.onChange === undefined ? {} : { onChange: props.onChange })}
          />
        )}
        {props.validating || props.pending ? (
          <p role="status" className="text-caption text-ink-muted">
            {t(props.validating ? "deckImport.status.validating" : "deckImport.status.importing")}
          </p>
        ) : null}
        {!props.preview && (
          <details>
            <summary className={summaryClass}>{t("deckImport.format.title")}</summary>
            <div className="space-y-2 rounded-control bg-canvas p-3 text-caption text-ink-muted">
              <p>{t("deckImport.format.encoding")}</p>
              <p>{t("deckImport.format.columns")}</p>
              <p>{t("deckImport.format.uniqueKey")}</p>
              <p>{t("deckImport.format.quoting")}</p>
            </div>
          </details>
        )}
      </section>
      {props.preview !== undefined && (
        <ImportPreview
          preview={props.preview}
          busy={busy}
          pending={props.pending ?? false}
          dark={props.dark ?? false}
          onImport={props.onImport}
        />
      )}
      {!props.preview && example && (
        <section aria-labelledby="import-examples-heading" className="min-w-0 space-y-4">
          <h2 id="import-examples-heading" className="text-title font-semibold">
            {t("deckImport.sample.title")}
          </h2>
          <fieldset aria-label={t("deckImport.sample.choose")} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {props.examples.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={item.id === exampleId}
                aria-controls="import-example-content"
                disabled={busy}
                onClick={() => setExampleId(item.id)}
                className="min-h-touch rounded-control border border-border bg-surface px-2 py-2 text-caption text-ink aria-pressed:border-accent-primary aria-pressed:bg-surface-muted aria-pressed:text-accent-primary disabled:opacity-50"
              >
                {t(`deckImport.sample.labels.${item.id}`)}
              </button>
            ))}
          </fieldset>
          <div id="import-example-content" className="space-y-3">
            <p className="text-caption text-ink-muted">{t(`deckImport.sample.descriptions.${example.id}`)}</p>
            <CardExamples cards={example.cards} dark={props.dark ?? false} />
            <details key={example.id} data-import-sample>
              <summary className={summaryClass}>{t("deckImport.sample.source")}</summary>
              <div className="max-h-80 overflow-auto">
                <Code text={example.csv} category="plaintext" dark={props.dark ?? false} />
              </div>
            </details>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" disabled={busy} onClick={() => props.onSelectExample?.(example.id)}>
                {t("deckImport.sample.try")}
              </Button>
              <Button variant="quiet" disabled={busy} onClick={() => props.onDownloadExample?.(example.id)}>
                <AiOutlineCloudDownload aria-hidden="true" />
                {t("deckImport.sample.download")}
              </Button>
            </div>
            <p className="text-caption text-ink-muted">{t("deckImport.sample.reviewHelp")}</p>
          </div>
        </section>
      )}
    </section>
  );
};
