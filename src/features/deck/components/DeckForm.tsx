import type * as React from "react";
import { useId } from "react";

import { Button, Form, FormItem, Input, Select, Switch } from "@/components";

export interface DeckFormFields {
  name: React.ComponentProps<typeof Input>;
  convertToBr: React.ComponentProps<typeof Switch>;
  url: React.ComponentProps<typeof Input>;
  category: React.ComponentProps<typeof Select>;
}

export interface DeckFormProps {
  deck: Deck;
  fields: DeckFormFields;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit?: React.ComponentProps<typeof Form>["onSubmit"];
}

export const DeckForm: React.FC<DeckFormProps> = (props) => {
  const sectionHeadingIdPrefix = useId();
  const basicHeadingId = `${sectionHeadingIdPrefix}-deck-basic-heading`;
  const importHeadingId = `${sectionHeadingIdPrefix}-deck-import-heading`;

  return (
    <Form {...(props.onSubmit !== undefined ? { onSubmit: props.onSubmit } : {})}>
      <section
        aria-labelledby={basicHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={basicHeadingId} className="text-title font-semibold text-ink">
            Basic information
          </h2>
          <p className="mt-1 text-caption text-ink-muted">Name and organize this deck.</p>
        </div>
        <FormItem col label="Name">
          <Input {...props.fields.name} />
        </FormItem>
        <FormItem col label="Category">
          <Select empty {...props.fields.category} />
        </FormItem>
      </section>
      <section
        aria-labelledby={importHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={importHeadingId} className="text-title font-semibold text-ink">
            Import &amp; formatting
          </h2>
          <p className="mt-1 text-caption text-ink-muted">Control the source and how imported text is displayed.</p>
        </div>
        <FormItem col label="Source URL">
          <Input {...props.fields.url} />
        </FormItem>
        <FormItem label="Convert line breaks" help="Convert two line breaks to one <br />.">
          <Switch {...props.fields.convertToBr} />
        </FormItem>
      </section>
      <details className="rounded-surface border border-border bg-surface-muted p-4">
        <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">
          Deck information
        </summary>
        <dl className="mt-4 grid gap-3 text-caption">
          <div className="min-w-0">
            <dt className="font-medium text-ink-muted">ID</dt>
            <dd className="break-all text-ink">{props.deck.id}</dd>
          </div>
          {Boolean(props.deck.createdAt) && (
            <div>
              <dt className="font-medium text-ink-muted">Created</dt>
              <dd className="text-ink">{new Date(props.deck.createdAt).toLocaleDateString()}</dd>
            </div>
          )}
          {Boolean(props.deck.updatedAt) && (
            <div>
              <dt className="font-medium text-ink-muted">Updated</dt>
              <dd className="text-ink">{new Date(props.deck.updatedAt).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
      </details>
      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button variant="quiet" type="button" {...(props.onCancel !== undefined ? { onClick: props.onCancel } : {})}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          {...(props.isSubmitting !== undefined ? { disabled: props.isSubmitting } : {})}
        >
          {props.isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
};
