import * as React from "react";

import { Button, Form, FormItem, Tag, TagList, Textarea } from "@src/shared/components";
import type { Option } from "@src/shared/components/forms/Select";

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
  return (
    <Form {...(props.onSubmit !== undefined ? { onSubmit: props.onSubmit } : {})}>
      <FormItem col label="Front Text">
        <Textarea rows={8} {...props.fields.frontText} />
      </FormItem>
      <FormItem col label="Back Text">
        <Textarea rows={8} {...props.fields.backText} />
      </FormItem>
      <FormItem col label="Tags">
        <TagList>
          {props.fields.tags.map(({ label, value, input }) => (
            <Tag className="mr-1 mb-1" primary small key={value} label={label} {...input} value={value} />
          ))}
        </TagList>
      </FormItem>
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
      <Button primary type="submit" {...(props.isSubmitting !== undefined ? { disabled: props.isSubmitting } : {})}>
        Save
      </Button>
    </Form>
  );
};
