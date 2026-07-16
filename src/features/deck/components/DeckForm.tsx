import type * as React from "react";
import { useId } from "react";

import { Button, Form, FormItem, Input, Select, Switch } from "@/shared/components";

export interface DeckFormFields {
  name: React.ComponentProps<typeof Input>;
  convertToBr: React.ComponentProps<typeof Switch>;
  url: React.ComponentProps<typeof Input>;
  isPublic: React.ComponentProps<typeof Switch>;
  localMode: React.ComponentProps<typeof Switch>;
  category: React.ComponentProps<typeof Select>;
}

export interface DeckFormProps {
  deck: Deck;
  fields: DeckFormFields;
  isSubmitting?: boolean;
  onSubmit?: React.ComponentProps<typeof Form>["onSubmit"];
}

export const DeckForm: React.FC<DeckFormProps> = (props) => {
  const sectionHeadingIdPrefix = useId();
  const detailsHeadingId = `${sectionHeadingIdPrefix}-deck-details-heading`;
  const availabilityHeadingId = `${sectionHeadingIdPrefix}-deck-availability-heading`;
  const metadataHeadingId = `${sectionHeadingIdPrefix}-deck-metadata-heading`;

  return (
    <Form {...(props.onSubmit !== undefined ? { onSubmit: props.onSubmit } : {})}>
      <section aria-labelledby={detailsHeadingId} className="space-y-4">
        <h2 id={detailsHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Deck details
        </h2>
        <FormItem col label="Name">
          <Input {...props.fields.name} />
        </FormItem>
        <FormItem label="Convert" extra="Convert two line breaks to one <br />">
          <Switch {...props.fields.convertToBr} />
        </FormItem>
        <FormItem col label="URL">
          <Input {...props.fields.url} />
        </FormItem>
        <FormItem col label="Category">
          <Select empty {...props.fields.category} />
        </FormItem>
      </section>
      <section
        aria-labelledby={availabilityHeadingId}
        className="space-y-4 rounded-surface border border-border bg-surface-muted p-4"
      >
        <h2 id={availabilityHeadingId} className="text-title font-semibold text-ink">
          Availability
        </h2>
        <FormItem label="Public" help="Public decks are not available yet.">
          <Switch {...props.fields.isPublic} disabled />
        </FormItem>
        <FormItem label="Local Mode" help="Local Mode is not available yet.">
          <Switch {...props.fields.localMode} disabled />
        </FormItem>
      </section>
      <section aria-labelledby={metadataHeadingId} className="space-y-4">
        <h2 id={metadataHeadingId} className="border-b border-border pb-2 text-title font-semibold text-ink">
          Metadata
        </h2>
        <FormItem col label="id">
          {props.deck.id}
        </FormItem>
        {Boolean(props.deck.createdAt) && (
          <FormItem label="Created At">{new Date(props.deck.createdAt).toLocaleDateString()}</FormItem>
        )}
        {Boolean(props.deck.updatedAt) && (
          <FormItem label="Updated At">{new Date(props.deck.updatedAt).toLocaleDateString()}</FormItem>
        )}
      </section>
      <Button primary type="submit" {...(props.isSubmitting !== undefined ? { disabled: props.isSubmitting } : {})}>
        Save
      </Button>
    </Form>
  );
};
