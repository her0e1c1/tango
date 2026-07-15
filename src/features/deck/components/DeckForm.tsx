import * as React from "react";

import { Button, Form, FormItem, Input, Select, Switch } from "@src/shared/components";

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
  return (
    <Form {...(props.onSubmit !== undefined ? { onSubmit: props.onSubmit } : {})}>
      <FormItem col label="Name">
        <Input {...props.fields.name} />
      </FormItem>
      <FormItem label="Convert" extra="Convert two line breaks to one <br />">
        <Switch {...props.fields.convertToBr} />
      </FormItem>
      <FormItem col label="URL">
        <Input {...props.fields.url} />
      </FormItem>
      <FormItem label="Public">
        <Switch disabled {...props.fields.isPublic} />
      </FormItem>
      <FormItem label="Local Mode">
        <Switch disabled {...props.fields.localMode} />
      </FormItem>
      <FormItem col label="Category">
        <Select empty {...props.fields.category} />
      </FormItem>
      <FormItem col label="id">
        {props.deck.id}
      </FormItem>
      {Boolean(props.deck.createdAt) && (
        <FormItem label="Created At">{new Date(props.deck.createdAt).toLocaleDateString()}</FormItem>
      )}
      {Boolean(props.deck.updatedAt) && (
        <FormItem label="Updated At">{new Date(props.deck.updatedAt).toLocaleDateString()}</FormItem>
      )}
      <Button primary type="submit" {...(props.isSubmitting !== undefined ? { disabled: props.isSubmitting } : {})}>
        Save
      </Button>
    </Form>
  );
};
