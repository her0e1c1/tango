/**
 * @file Composes the import feature's complete Deck Import Template screen.
 * Data and callbacks arrive through props, which keeps this presentation usable in both a live
 * container and Storybook.
 */

import type * as React from "react";
import { AiOutlineCloudDownload } from "react-icons/ai";

import { Button, Code, Description, Upload } from "@/components";
import { Layout, type LayoutProps } from "@/components/layout/Layout";
import type { DeckImportPreview, DeckImportResult } from "@/features/import/components/deckImportTypes";

interface DeckImportTemplateProps {
  onChange?: (file: File) => void;
  onAddSample?: () => void;
  onDownloadSample?: () => void;
  onImport?: () => void;
  onRetry?: () => void;
  onBack?: () => void;
  sampleText: string;
  dark?: boolean;
  layout?: LayoutProps;
  validating?: boolean;
  pending?: boolean;
  preview?: DeckImportPreview;
  result?: DeckImportResult;
  partialResult?: DeckImportResult;
  error?: unknown;
}

/**
 * Renders the created, updated, skipped, and failed totals for an import result.
 * The same compact summary is used for successful and partially failed imports.
 */
const resultCounts = (result: DeckImportResult) => (
  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption">
    <li>{result.created} created</li>
    <li>{result.updated} updated</li>
    <li>{result.skipped} skipped</li>
    {result.failed > 0 ? <li>{result.failed} failed</li> : null}
  </ul>
);

interface ImportResultProps {
  result: DeckImportResult | undefined;
  partialResult: DeckImportResult | undefined;
  error: unknown;
  onRetry: (() => void) | undefined;
  onBack: (() => void) | undefined;
}

/**
 * Composes the complete Import Result screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
 */
const ImportResult = (props: ImportResultProps) => {
  if (props.partialResult != null) {
    return (
      <section role="alert" className="rounded-surface border border-warning bg-surface-muted p-4 text-ink">
        <h2 className="font-bold">Import partially completed</h2>
        <p className="mt-1 text-caption text-ink-muted">
          Successful rows are kept. Retry safely rechecks each uniqueKey before writing.
        </p>
        {resultCounts(props.partialResult)}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" {...(props.onRetry !== undefined ? { onClick: props.onRetry } : {})}>
            Retry
          </Button>
          <Button variant="quiet" size="sm" {...(props.onBack !== undefined ? { onClick: props.onBack } : {})}>
            Back to decks
          </Button>
        </div>
      </section>
    );
  }
  if (props.error != null) {
    const message = props.error instanceof Error ? props.error.message : "The import could not be completed.";
    return (
      <section role="alert" className="rounded-surface border border-danger bg-surface-muted p-4 text-ink">
        <h2 className="font-bold">Import failed</h2>
        <p className="mt-1 break-words text-caption text-ink-muted">{message}</p>
        <Button className="mt-3" size="sm" {...(props.onRetry !== undefined ? { onClick: props.onRetry } : {})}>
          Retry
        </Button>
      </section>
    );
  }
  if (props.result == null) return null;
  return (
    <section role="status" className="rounded-surface border border-success bg-surface-muted p-4 text-ink">
      <h2 className="font-bold">Import complete</h2>
      {resultCounts(props.result)}
      <Button
        className="mt-3"
        variant="quiet"
        size="sm"
        {...(props.onBack !== undefined ? { onClick: props.onBack } : {})}
      >
        Back to decks
      </Button>
    </section>
  );
};

interface ImportPreviewProps {
  preview: DeckImportPreview | undefined;
  pending: boolean | undefined;
  validating: boolean | undefined;
  onImport: (() => void) | undefined;
}

/**
 * Composes the complete Import Preview screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
 */
const ImportPreview = (props: ImportPreviewProps) => {
  const preview = props.preview;
  if (preview == null) return null;

  const busy = props.pending === true || props.validating === true;
  const canImport = preview.analysis.rows.length > 0 && preview.analysis.invalidCount === 0 && !busy;
  const visibleRows = preview.plan.rows.slice(0, 10);
  const hiddenRowCount = preview.plan.rows.length - visibleRows.length;

  return (
    <section aria-labelledby="import-preview-heading" className="space-y-4">
      <div>
        <h2 id="import-preview-heading" className="text-title font-bold text-ink">
          Review import
        </h2>
        <p className="mt-1 break-words text-caption text-ink-muted">
          Deck: <strong className="text-ink">{preview.deckName}</strong>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-surface border border-border bg-surface-muted p-3">
          <h3 className="font-semibold text-ink">Validation</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
            <li>{preview.analysis.rows.length} valid</li>
            <li>{preview.analysis.skippedRows.length} skipped</li>
            <li>{preview.analysis.invalidCount} invalid</li>
          </ul>
        </div>
        <div className="rounded-surface border border-border bg-surface-muted p-3">
          <h3 className="font-semibold text-ink">Planned changes</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
            <li>{preview.plan.created} create</li>
            <li>{preview.plan.updated} update</li>
            <li>{preview.plan.unchanged} unchanged</li>
          </ul>
        </div>
      </div>

      {preview.analysis.issues.length > 0 ? (
        <div role="alert" className="rounded-surface border border-danger bg-surface-muted p-3 text-caption text-ink">
          <h3 className="font-semibold">Fix these CSV rows</h3>
          <ul className="mt-2 space-y-2">
            {preview.analysis.issues.map((issue) => (
              <li key={`${issue.rowNumber ?? "file"}-${issue.message}-${issue.context ?? ""}`}>
                <span className="font-semibold">{issue.rowNumber == null ? "File" : `Row ${issue.rowNumber}`}:</span>{" "}
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
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Front</th>
                <th className="px-3 py-2">Back</th>
                <th className="px-3 py-2">Tags</th>
                <th className="px-3 py-2">uniqueKey</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.rowNumber} className="border-t border-border">
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="px-3 py-2 capitalize">{row.action}</td>
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
        <p className="text-caption text-ink-muted">{hiddenRowCount} more valid rows are not shown.</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={!canImport}
          loading={props.pending ?? false}
          {...(props.onImport !== undefined ? { onClick: props.onImport } : {})}
        >
          Import
        </Button>
        {preview.analysis.invalidCount > 0 ? (
          <p className="text-caption text-ink-muted">Choose a corrected CSV file to continue.</p>
        ) : null}
      </div>
    </section>
  );
};

/**
 * Composes the complete Deck Import Template screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
 */
export const DeckImportTemplate: React.FC<DeckImportTemplateProps> = (props) => {
  const busy = props.pending === true || props.validating === true;

  return (
    <Layout showHeader {...props.layout}>
      <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
        <h1 className="mb-section-gap break-words text-display font-bold text-ink">Import decks</h1>
        <div className="space-y-section-gap">
          {props.validating ? (
            <p role="status" className="text-caption text-ink-muted">
              Validating CSV…
            </p>
          ) : props.pending ? (
            <p role="status" className="text-caption text-ink-muted">
              Importing…
            </p>
          ) : null}
          <ImportResult
            result={props.result}
            partialResult={props.partialResult}
            error={props.error}
            onRetry={props.onRetry}
            onBack={props.onBack}
          />
          <section>
            <h2 className="mb-3 break-words text-title font-bold text-ink">Choose a CSV file</h2>
            <Upload
              disabled={busy}
              {...(props.preview !== undefined ? { fileName: props.preview.fileName } : {})}
              {...(props.onChange !== undefined ? { onChange: props.onChange } : {})}
            />
          </section>
          <ImportPreview
            preview={props.preview}
            pending={props.pending}
            validating={props.validating}
            onImport={props.onImport}
          />
          <section>
            <h2 className="mb-2 break-words text-title font-bold text-ink">CSV format</h2>
            <div className="space-y-2">
              <Description>
                Four columns without a header: front text, back text, tags (optional), and uniqueKey.
              </Description>
              <Description>
                uniqueKey is required. Keep it stable to update the same card and avoid duplicates when importing again.
              </Description>
            </div>
          </section>
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="break-words text-title font-bold text-ink">Sample</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  {...(props.onAddSample !== undefined ? { onClick: props.onAddSample } : {})}
                >
                  Add sample deck
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  {...(props.onDownloadSample !== undefined ? { onClick: props.onDownloadSample } : {})}
                >
                  <AiOutlineCloudDownload aria-hidden="true" className="text-xl" size={24} />
                  <span aria-hidden="true" className="text-caption text-ink-muted underline">
                    download
                  </span>
                  <span className="sr-only">Download CSV sample</span>
                </Button>
              </div>
            </div>
            <div
              data-import-sample
              className="overflow-x-auto rounded-surface border border-border bg-surface-muted p-2"
            >
              <Code text={props.sampleText} category="csv" dark={props.dark ?? false} />
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
};
