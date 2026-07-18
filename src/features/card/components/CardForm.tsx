import type * as React from "react";
import { useId } from "react";

import { Button, Form, FormItem, Tag, TagList, Textarea } from "@/components";
import type { Option } from "@/components/forms/Select";

export interface CardFormTagField extends Option {
  input: React.ComponentProps<typeof Tag>;
}

export interface CardFormFields {
  frontText: React.ComponentProps<typeof Textarea>;
  backText: React.ComponentProps<typeof Textarea>;
  tags: CardFormTagField[];
}

export interface CardFormProps {
  card: Card;
  fields: CardFormFields;
  errors?: {
    frontText?: string;
    backText?: string;
  };
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit?: React.ComponentProps<typeof Form>["onSubmit"];
}

export const CardForm: React.FC<CardFormProps> = (props) => {
  const sectionHeadingIdPrefix = useId();
  const frontHeadingId = `${sectionHeadingIdPrefix}-card-front-heading`;
  const backHeadingId = `${sectionHeadingIdPrefix}-card-back-heading`;
  const tagsHeadingId = `${sectionHeadingIdPrefix}-card-tags-heading`;

  return (
    <Form {...(props.onSubmit !== undefined ? { onSubmit: props.onSubmit } : {})}>
      <section
        aria-labelledby={frontHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={frontHeadingId} className="text-title font-semibold text-ink">
            Front
          </h2>
          <p className="mt-1 text-caption text-ink-muted">The prompt shown during study.</p>
        </div>
        <FormItem col label="Front text" error={props.errors?.frontText}>
          <Textarea rows={8} {...props.fields.frontText} aria-invalid={props.errors?.frontText != null || undefined} />
        </FormItem>
      </section>
      <section
        aria-labelledby={backHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={backHeadingId} className="text-title font-semibold text-ink">
            Back
          </h2>
          <p className="mt-1 text-caption text-ink-muted">The answer revealed after the prompt.</p>
        </div>
        <FormItem col label="Back text" error={props.errors?.backText}>
          <Textarea rows={8} {...props.fields.backText} aria-invalid={props.errors?.backText != null || undefined} />
        </FormItem>
      </section>
      <section
        aria-labelledby={tagsHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
      >
        <div>
          <h2 id={tagsHeadingId} className="text-title font-semibold text-ink">
            Tags
          </h2>
          <p className="mt-1 text-caption text-ink-muted">Organize this card for filtering and study sessions.</p>
        </div>
        <TagList>
          {props.fields.tags.map(({ label, value, input }) => (
            <Tag className="mr-1 mb-1" primary small key={value} label={label} {...input} value={value} />
          ))}
        </TagList>
      </section>
      <details className="rounded-surface border border-border bg-surface-muted p-4">
        <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">
          Card information
        </summary>
        <dl className="mt-4 grid gap-3 text-caption">
          <div className="min-w-0">
            <dt className="font-medium text-ink-muted">Unique key</dt>
            <dd className="break-all text-ink">{props.card.uniqueKey ?? ""}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-ink-muted">ID</dt>
            <dd className="break-all text-ink">{props.card.id}</dd>
          </div>
          {Boolean(props.card.createdAt) && (
            <div>
              <dt className="font-medium text-ink-muted">Created</dt>
              <dd className="text-ink">{new Date(props.card.createdAt).toLocaleDateString()}</dd>
            </div>
          )}
          {props.card.lastSeenAt != null && (
            <div>
              <dt className="font-medium text-ink-muted">Last seen</dt>
              <dd className="text-ink">{new Date(props.card.lastSeenAt).toLocaleDateString()}</dd>
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
