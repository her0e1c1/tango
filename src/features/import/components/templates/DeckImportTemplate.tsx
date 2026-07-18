import type * as React from "react";
import { AiOutlineCloudDownload } from "react-icons/ai";
import { Button, Code, Description, Upload } from "@/components";
import { Layout, type LayoutProps } from "@/components/layout/Layout";

export const DeckImportTemplate: React.FC<{
  onChange?: (file: File) => void;
  onAddSample?: () => void;
  onDownloadSample?: () => void;
  sampleText: string;
  dark?: boolean;
  layout?: LayoutProps;
  pending?: boolean;
  feedbackSlot?: React.ReactNode;
}> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <section className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6">
        <h1 className="mb-section-gap break-words text-display font-bold text-ink">Import decks</h1>
        {props.feedbackSlot}
        <div className="space-y-section-gap">
          <section>
            <h2 className="mb-3 break-words text-title font-bold text-ink">Choose a CSV file</h2>
            <Upload
              {...(props.pending !== undefined ? { disabled: props.pending } : {})}
              {...(props.onChange !== undefined ? { onChange: props.onChange } : {})}
            />
          </section>
          <section>
            <h2 className="mb-2 break-words text-title font-bold text-ink">CSV format</h2>
            <Description>{`There are 3 columns without header: front text, back text, and tags (optional).`}</Description>
          </section>
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="break-words text-title font-bold text-ink">Sample</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  {...(props.pending !== undefined ? { disabled: props.pending } : {})}
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
