import type * as React from "react";
import { AiOutlineCloudDownload } from "react-icons/ai";

import { Button } from "@/shared/ui/button";
import { Code, Description } from "@/shared/ui/content";
import { Select, Upload } from "@/shared/ui/forms";
import type { DeckImportPreview } from "../model/useDeckImport";
import type { DeckImportDestinationType } from "../model/useDeckImportPreview";
import type {
  DeckImportDestinationOption,
  DeckImportResult,
  DeckImportStorageMode,
} from "../model/useDeckImportExecution";

interface DeckImportViewProps {
  onChange?: (file: File) => void;
  onStorageModeChange?: (storageMode: DeckImportStorageMode) => void;
  onDestinationTypeChange?: (destinationType: DeckImportDestinationType) => void;
  onDestinationDeckChange?: (deckId: string) => void;
  onAddSample?: () => void;
  onDownloadSample?: () => void;
  onImport?: () => void;
  onBack?: () => void;
  sampleText: string;
  dark?: boolean;
  validating?: boolean;
  pending?: boolean;
  preview?: DeckImportPreview | undefined;
  result?: DeckImportResult | undefined;
  error?: unknown;
  previewError?: unknown;
  storageMode?: DeckImportStorageMode;
  destinationType?: DeckImportDestinationType;
  destinationDeckId?: string | undefined;
  destinationOptions?: DeckImportDestinationOption[];
}

const resultCounts = (result: DeckImportResult) => (
  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption">
    <li>{result.created} created</li>
    <li>{result.updated} updated</li>
    <li>{result.skipped} skipped</li>
  </ul>
);

interface ImportResultProps {
  result: DeckImportResult | undefined;
  error: unknown;
  onBack: (() => void) | undefined;
}

const ImportResult = (props: ImportResultProps) => {
  if (props.error != null) {
    const message = props.error instanceof Error ? props.error.message : "The import could not be completed.";
    return (
      <section role="alert" className="rounded-surface border border-danger bg-surface-muted p-4 text-ink">
        <h2 className="font-bold">Import failed</h2>
        <p className="mt-1 break-words text-caption text-ink-muted">{message}</p>
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
  pending: boolean | undefined;
  validating: boolean | undefined;
  onImport: (() => void) | undefined;
}

const ImportPreview = (props: ImportPreviewProps) => {
  const { preview } = props;
  if (preview == null) return null;

  const busy = Boolean(props.pending || props.validating);
  const canImport = preview.analysis.rows.length > 0 && preview.analysis.invalidCount === 0 && !busy;
  const visibleRows = preview.analysis.rows.slice(0, 10);
  const hiddenRowCount = preview.analysis.rows.length - visibleRows.length;
  const actionByRowNumber = new Map(preview.plan?.rows.map((row) => [row.rowNumber, row.action]) ?? []);

  return (
    <section aria-labelledby="import-preview-heading" className="space-y-4">
      <div>
        <h2 id="import-preview-heading" className="text-title font-bold text-ink">
          Review import
        </h2>
        <dl className="mt-1 space-y-1 break-words text-caption text-ink-muted">
          <div>
            <dt className="inline">CSV: </dt>
            <dd className="inline font-semibold text-ink">{preview.deckName}</dd>
          </div>
          <div>
            <dt className="inline">Destination: </dt>
            <dd className="inline font-semibold text-ink">{preview.destinationLabel}</dd>
          </div>
        </dl>
      </div>

      <div className={preview.plan == null ? undefined : "grid gap-3 sm:grid-cols-2"}>
        <div className="rounded-surface border border-border bg-surface-muted p-3">
          <h3 className="font-semibold text-ink">Validation</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
            <li>{preview.analysis.rows.length} valid</li>
            <li>{preview.analysis.skippedRows.length} skipped</li>
            <li>{preview.analysis.invalidCount} invalid</li>
          </ul>
        </div>
        {preview.plan == null ? null : (
          <div className="rounded-surface border border-border bg-surface-muted p-3">
            <h3 className="font-semibold text-ink">Planned changes</h3>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
              <li>{preview.plan.created} create</li>
              <li>{preview.plan.updated} update</li>
              <li>{preview.plan.unchanged} unchanged</li>
            </ul>
          </div>
        )}
      </div>

      {preview.analysis.issues.length > 0 ? (
        <div role="alert" className="rounded-surface border border-danger bg-surface-muted p-3 text-caption text-ink">
          <h3 className="font-semibold">Fix these CSV rows</h3>
          <ul className="mt-2 space-y-2">
            {preview.analysis.issues.map((issue) => (
              <li key={`${String(issue.rowNumber ?? "file")}-${issue.message}-${issue.context ?? ""}`}>
                <span className="font-semibold">
                  {issue.rowNumber == null ? "File" : `Row ${String(issue.rowNumber)}`}:
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
                <th className="px-3 py-2">Row</th>
                {preview.plan == null ? null : <th className="px-3 py-2">Action</th>}
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
                  {preview.plan == null ? null : (
                    <td className="px-3 py-2 capitalize">{actionByRowNumber.get(row.rowNumber)}</td>
                  )}
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

interface ImportDestinationProps {
  busy: boolean;
  destinationType: DeckImportDestinationType;
  destinationDeckId: string | undefined;
  destinationOptions: DeckImportDestinationOption[];
  onDestinationTypeChange: DeckImportViewProps["onDestinationTypeChange"];
  onDestinationDeckChange: DeckImportViewProps["onDestinationDeckChange"];
}

const ImportDestination = (props: ImportDestinationProps) => (
  <fieldset className="space-y-2" disabled={props.busy}>
    <legend className="mb-2 font-semibold text-ink">Import destination</legend>
    <label className="flex cursor-pointer items-start gap-2 text-body text-ink">
      <input
        type="radio"
        name="deck-import-destination-type"
        value="new"
        checked={props.destinationType === "new"}
        onChange={() => props.onDestinationTypeChange?.("new")}
      />
      <span>
        <span className="block font-semibold">Create new deck</span>
        <span className="block text-caption text-ink-muted">Always create a new Deck for this CSV.</span>
      </span>
    </label>
    <label className="flex cursor-pointer items-start gap-2 text-body text-ink">
      <input
        type="radio"
        name="deck-import-destination-type"
        value="existing"
        checked={props.destinationType === "existing"}
        onChange={() => props.onDestinationTypeChange?.("existing")}
      />
      <span>
        <span className="block font-semibold">Import into existing deck</span>
        <span className="block text-caption text-ink-muted">Match Cards by uniqueKey in a Deck you choose.</span>
      </span>
    </label>
    {props.destinationType === "existing" ? (
      <div className="space-y-1 pl-6">
        <label htmlFor="deck-import-destination" className="block text-caption font-semibold text-ink">
          Destination deck
        </label>
        <Select
          id="deck-import-destination"
          empty
          value={props.destinationDeckId ?? ""}
          options={props.destinationOptions.map((option) => ({ label: option.label, value: option.id }))}
          onChange={(event) => props.onDestinationDeckChange?.(event.currentTarget.value)}
        />
        {props.destinationOptions.length === 0 ? (
          <p className="text-caption text-ink-muted">No Decks use the selected storage mode.</p>
        ) : props.destinationDeckId == null ? (
          <p className="text-caption text-ink-muted">Choose a destination Deck before selecting a CSV file.</p>
        ) : null}
      </div>
    ) : null}
  </fieldset>
);

const hasSelectedDestination = (
  destinationType: DeckImportDestinationType,
  destinationDeckId: string | undefined,
  destinationOptions: DeckImportDestinationOption[]
) => destinationType === "new" || destinationOptions.some((option) => option.id === destinationDeckId);

export const DeckImportView: React.FC<DeckImportViewProps> = (props) => {
  const busy = Boolean(props.pending || props.validating);
  const storageMode = props.storageMode ?? "remote";
  const destinationType = props.destinationType ?? "new";
  const destinationOptions = props.destinationOptions ?? [];
  const destinationReady = hasSelectedDestination(destinationType, props.destinationDeckId, destinationOptions);

  return (
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
        <ImportResult result={props.result} error={props.error} onBack={props.onBack} />
        <PreviewError error={props.previewError} />
        <section className="space-y-4">
          <h2 className="mb-3 break-words text-title font-bold text-ink">Choose a CSV file</h2>
          <fieldset className="space-y-2" disabled={busy}>
            <legend className="mb-2 font-semibold text-ink">Save this CSV import</legend>
            <label className="flex cursor-pointer items-start gap-2 text-body text-ink">
              <input
                type="radio"
                name="deck-import-storage-mode"
                value="local"
                checked={storageMode === "local"}
                onChange={() => props.onStorageModeChange?.("local")}
              />
              <span>
                <span className="block font-semibold">Local only</span>
                <span className="block text-caption text-ink-muted">Keep this Deck and its Cards on this device.</span>
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
                <span className="block font-semibold">Sync with account</span>
                <span className="block text-caption text-ink-muted">Save to your account and sync across devices.</span>
              </span>
            </label>
          </fieldset>
          <ImportDestination
            busy={busy}
            destinationType={destinationType}
            destinationDeckId={props.destinationDeckId}
            destinationOptions={destinationOptions}
            onDestinationTypeChange={props.onDestinationTypeChange}
            onDestinationDeckChange={props.onDestinationDeckChange}
          />
          <Upload
            disabled={busy || !destinationReady}
            {...(props.preview !== undefined ? { fileName: props.preview.deckName } : {})}
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
              uniqueKey is required and must be unique within the CSV file. Existing Deck imports use it to create,
              update, or leave each Card unchanged.
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
          <div data-import-sample className="overflow-x-auto rounded-surface border border-border bg-surface-muted p-2">
            <Code text={props.sampleText} category="csv" dark={props.dark ?? false} />
          </div>
        </section>
      </div>
    </section>
  );
};
