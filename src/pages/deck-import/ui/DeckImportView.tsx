import type * as React from "react";
import { AiOutlineCloudDownload } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { Code, Description } from "@/shared/ui/content";
import { Upload } from "@/shared/ui/forms";

type DeckImportStorageMode = "local" | "remote";

interface DeckImportPreviewRow {
  rowNumber: number;
  card: {
    frontText: string;
    backText: string;
    tags: readonly string[];
    uniqueKey: string;
  };
}

interface DeckImportPreviewIssue {
  rowNumber?: number;
  message: string;
  context?: string;
}

interface DeckImportPreview {
  deckName: string;
  analysis: {
    rows: readonly DeckImportPreviewRow[];
    skippedRows: readonly unknown[];
    issues: readonly DeckImportPreviewIssue[];
    invalidCount: number;
  };
}

export interface DeckImportViewProps {
  onChange?: (file: File) => void;
  onStorageModeChange?: (storageMode: DeckImportStorageMode) => void;
  onAddSample?: () => void;
  onDownloadSample?: () => void;
  onImport?: () => void;
  sampleText: string;
  dark?: boolean;
  validating?: boolean;
  pending?: boolean;
  addingSample?: boolean;
  preview?: DeckImportPreview | undefined;
  previewError?: unknown;
  storageMode?: DeckImportStorageMode;
}

const PreviewError = ({ error }: { error: unknown }) => {
  if (error == null) return null;
  const message = error instanceof Error ? error.message : "The import preview could not be prepared.";
  return (
    <section role="alert" className="rounded-surface border border-danger bg-surface-muted p-4 text-ink">
      <h2 className="font-bold">Unable to prepare preview</h2>
      <p className="mt-1 break-words text-caption text-ink-muted">{message}</p>
      <p className="mt-2 text-caption text-ink-muted">Choose the CSV file again to retry.</p>
    </section>
  );
};

interface ImportPreviewProps {
  preview: DeckImportPreview | undefined;
  busy: boolean;
  pending: boolean | undefined;
  onImport: (() => void) | undefined;
}

const ImportPreview = (props: ImportPreviewProps) => {
  const { t } = useTranslation();
  const { preview } = props;
  if (preview == null) return null;

  const canImport = preview.analysis.rows.length > 0 && preview.analysis.invalidCount === 0 && !props.busy;
  const visibleRows = preview.analysis.rows.slice(0, 10);
  const hiddenRowCount = preview.analysis.rows.length - visibleRows.length;

  return (
    <section aria-labelledby="import-preview-heading" className="space-y-4">
      <div>
        <h2 id="import-preview-heading" className="text-title font-bold text-ink">
          {t("deckImport.preview.title")}
        </h2>
        <p className="mt-1 break-words text-caption text-ink-muted">
          {t("deckImport.preview.deck")} <strong className="text-ink">{preview.deckName}</strong>
        </p>
      </div>

      <div>
        <div className="rounded-surface border border-border bg-surface-muted p-3">
          <h3 className="font-semibold text-ink">{t("deckImport.preview.validation")}</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
            <li>{t("deckImport.preview.valid", { count: preview.analysis.rows.length })}</li>
            <li>{t("deckImport.preview.skipped", { count: preview.analysis.skippedRows.length })}</li>
            <li>{t("deckImport.preview.invalid", { count: preview.analysis.invalidCount })}</li>
          </ul>
        </div>
      </div>

      {preview.analysis.issues.length > 0 ? (
        <div role="alert" className="rounded-surface border border-danger bg-surface-muted p-3 text-caption text-ink">
          <h3 className="font-semibold">{t("deckImport.preview.issuesTitle")}</h3>
          <ul className="mt-2 space-y-2">
            {preview.analysis.issues.map((issue) => (
              <li key={`${String(issue.rowNumber ?? "file")}-${issue.message}-${issue.context ?? ""}`}>
                <span className="font-semibold">
                  {issue.rowNumber == null
                    ? t("deckImport.preview.file")
                    : t("deckImport.preview.row", { rowNumber: issue.rowNumber })}
                  :
                </span>{" "}
                {issue.message}
                {issue.context == null ? null : (
                  <code className="mt-1 block overflow-x-auto whitespace-pre-wrap text-ink-muted">{issue.context}</code>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {visibleRows.length > 0 ? (
        <div className="overflow-x-auto rounded-surface border border-border">
          <table className="w-full min-w-max border-collapse text-left text-caption text-ink">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2">{t("deckImport.preview.table.row")}</th>
                <th className="px-3 py-2">{t("deckImport.preview.table.front")}</th>
                <th className="px-3 py-2">{t("deckImport.preview.table.back")}</th>
                <th className="px-3 py-2">{t("deckImport.preview.table.tags")}</th>
                <th className="px-3 py-2">{t("deckImport.preview.table.uniqueKey")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.rowNumber} className="border-t border-border">
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="max-w-64 break-words px-3 py-2">{row.card.frontText}</td>
                  <td className="max-w-64 break-words px-3 py-2">{row.card.backText}</td>
                  <td className="px-3 py-2">{row.card.tags.join(", ")}</td>
                  <td className="px-3 py-2">{row.card.uniqueKey}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {hiddenRowCount > 0 ? (
        <p className="text-caption text-ink-muted">{t("deckImport.preview.moreRows", { count: hiddenRowCount })}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={!canImport}
          loading={props.pending ?? false}
          {...(props.onImport !== undefined ? { onClick: props.onImport } : {})}
        >
          {t("deckImport.preview.import")}
        </Button>
        {preview.analysis.invalidCount > 0 ? (
          <p className="text-caption text-ink-muted">{t("deckImport.preview.correctedFile")}</p>
        ) : null}
      </div>
    </section>
  );
};

export const DeckImportView: React.FC<DeckImportViewProps> = (props) => {
  const { t } = useTranslation();
  const busy = Boolean(props.pending || props.validating || props.addingSample);
  const storageMode = props.storageMode ?? "remote";

  return (
    <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
      <h1 className="mb-section-gap break-words text-display font-bold text-ink">{t("deckImport.title")}</h1>
      <div className="space-y-section-gap">
        {props.validating ? (
          <p role="status" className="text-caption text-ink-muted">
            {t("deckImport.status.validating")}
          </p>
        ) : props.pending ? (
          <p role="status" className="text-caption text-ink-muted">
            {t("deckImport.status.importing")}
          </p>
        ) : null}
        <PreviewError error={props.previewError} />
        <section className="space-y-4">
          <h2 className="mb-3 break-words text-title font-bold text-ink">{t("deckImport.file.title")}</h2>
          <fieldset className="space-y-2" disabled={busy}>
            <legend className="mb-2 font-semibold text-ink">{t("deckImport.storage.legend")}</legend>
            <label className="flex cursor-pointer items-start gap-2 text-body text-ink">
              <input
                type="radio"
                name="deck-import-storage-mode"
                value="local"
                checked={storageMode === "local"}
                onChange={() => props.onStorageModeChange?.("local")}
              />
              <span>
                <span className="block font-semibold">{t("deckImport.storage.localLabel")}</span>
                <span className="block text-caption text-ink-muted">{t("deckImport.storage.localHelp")}</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-body text-ink">
              <input
                type="radio"
                name="deck-import-storage-mode"
                value="remote"
                checked={storageMode === "remote"}
                onChange={() => props.onStorageModeChange?.("remote")}
              />
              <span>
                <span className="block font-semibold">{t("deckImport.storage.remoteLabel")}</span>
                <span className="block text-caption text-ink-muted">{t("deckImport.storage.remoteHelp")}</span>
              </span>
            </label>
          </fieldset>
          <Upload
            disabled={busy}
            {...(props.preview !== undefined ? { fileName: props.preview.deckName } : {})}
            {...(props.onChange !== undefined ? { onChange: props.onChange } : {})}
          />
        </section>
        <ImportPreview preview={props.preview} busy={busy} pending={props.pending} onImport={props.onImport} />
        <section>
          <h2 className="mb-2 break-words text-title font-bold text-ink">{t("deckImport.format.title")}</h2>
          <div className="space-y-2">
            <Description>{t("deckImport.format.columns")}</Description>
            <Description>{t("deckImport.format.uniqueKey")}</Description>
          </div>
        </section>
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="break-words text-title font-bold text-ink">{t("deckImport.sample.title")}</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy}
                loading={props.addingSample ?? false}
                {...(props.onAddSample !== undefined ? { onClick: props.onAddSample } : {})}
              >
                {t("deckImport.sample.add")}
              </Button>
              <Button
                variant="quiet"
                size="sm"
                {...(props.onDownloadSample !== undefined ? { onClick: props.onDownloadSample } : {})}
              >
                <AiOutlineCloudDownload aria-hidden="true" className="text-xl" size={24} />
                <span aria-hidden="true" className="text-caption text-ink-muted underline">
                  {t("deckImport.sample.download")}
                </span>
                <span className="sr-only">{t("deckImport.sample.downloadAria")}</span>
              </Button>
            </div>
          </div>
          <div data-import-sample className="overflow-x-auto rounded-surface border border-border bg-surface-muted p-2">
            <Code text={props.sampleText} category="csv" dark={props.dark ?? false} />
          </div>
        </section>
      </div>
    </section>
  );
};
