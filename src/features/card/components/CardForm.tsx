import type * as React from "react";
import { useId } from "react";

import { Button, Form, FormItem, Tag, TagList, Textarea } from "@/shared/components";
import type { Option } from "@/shared/components/forms/Select";

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
  isSubmitting?: boolean;
  onSubmit?: React.ComponentProps<typeof Form>["onSubmit"];
}

export const CardForm: React.FC<CardFormProps> = (props) => {
  const sectionHeadingIdPrefix = useId();
  const contentHeadingId = `${sectionHeadingIdPrefix}-card-content-heading`;
  const tagsHeadingId = `${sectionHeadingIdPrefix}-card-tags-heading`;
  const metadataHeadingId = `${sectionHeadingIdPrefix}-card-metadata-heading`;

  return (
    <Form {...(props.onSubmit !== undefined ? { onSubmit: props.onSubmit } : {})}>
      <section aria-labelledby={contentHeadingId} className="space-y-4">
        <h2 id={contentHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Card content
        </h2>
        <FormItem col label="Front Text">
          <Textarea rows={8} {...props.fields.frontText} />
        </FormItem>
        <FormItem col label="Back Text">
          <Textarea rows={8} {...props.fields.backText} />
        </FormItem>
      </section>
      <section
        aria-labelledby={tagsHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface-muted p-4"
      >
        <h2 id={tagsHeadingId} className="text-title font-semibold text-ink">
          Tags
        </h2>
        <TagList>
          {props.fields.tags.map(({ label, value, input }) => (
            <Tag className="mr-1 mb-1" primary small key={value} label={label} {...input} value={value} />
          ))}
        </TagList>
      </section>
      <section aria-labelledby={metadataHeadingId} className="space-y-4">
        <h2 id={metadataHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Metadata
        </h2>
        <FormItem col label="Unique Key">
          {props.card.uniqueKey ?? ""}
        </FormItem>
        <FormItem col label="id">
          {props.card.id}
        </FormItem>
        <FormItem label="Created At">{props.card.createdAt}</FormItem>
        <FormItem label="Last Seen At">
          {props.card.lastSeenAt && new Date(props.card.lastSeenAt).toLocaleDateString()}
        </FormItem>
      </section>
      <Button primary type="submit" {...(props.isSubmitting !== undefined ? { disabled: props.isSubmitting } : {})}>
        Save
      </Button>
    </Form>
  );
};
