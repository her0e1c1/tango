import * as React from "react";

import { Button, Tag, Textarea } from "../Atom";
import { Form, FormItem, TagList } from "../Molecule";
import { useForm } from "react-hook-form";
import { renameKey } from "./form";

export const CardForm: React.FC<CardFormProps> = (props) => {
  const { handleSubmit, register, formState } = useForm<Card>({
    defaultValues: props.card,
  });
  return (
    <Form
      onSubmit={handleSubmit((data) => {
        props.onSubmit?.(data);
      })}
    >
      <FormItem col label="Front Text">
        <Textarea rows={8} {...renameKey(register("frontText"))} />
      </FormItem>
      <FormItem col label="Back Text">
        <Textarea rows={8} {...renameKey(register("backText"))} />
      </FormItem>
      <FormItem col label="Tags">
        <TagList>
          {props.categoryOptions?.map(({ label, value }) => (
            <Tag
              className="mr-1 mb-1"
              primary
              small
              key={value}
              label={label}
              {...renameKey(register("tags"))}
              value={value} // need to over write
            />
          ))}
        </TagList>
      </FormItem>
      <FormItem col label="Unique Key">
        {props.card?.uniqueKey ?? ""}
      </FormItem>
      <FormItem col label="id">
        {props.card?.id}
      </FormItem>
      <FormItem label="Created At">{props.card?.createdAt}</FormItem>
      <FormItem label="Last Seen At">
        {props.card?.lastSeenAt && new Date(props.card?.lastSeenAt).toLocaleDateString()}
      </FormItem>
      <Button primary type="submit" disabled={formState.isSubmitting}>
        Save
      </Button>
    </Form>
  );
};
