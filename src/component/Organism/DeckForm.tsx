import * as React from "react";

import { Switch, Button, Select, Input } from "../Atom";
import { Form, FormItem } from "../Molecule";
import { useForm } from "react-hook-form";
import { renameKey } from "./form";

export const DeckForm: React.FC<DeckFormProps> = (props) => {
  const { handleSubmit, register, formState } = useForm<Deck>({
    defaultValues: props.deck,
  });
  return (
    <Form
      onSubmit={handleSubmit((data) => {
        props.onSubmit?.(data);
      })}
    >
      <FormItem col label="Name">
        <Input {...renameKey(register("name"))} />
      </FormItem>
      <FormItem label="Convert" extra="Convert two line breaks to one <br />">
        <Switch {...renameKey(register("convertToBr"))} />
      </FormItem>
      <FormItem col label="URL">
        <Input {...renameKey(register("url"))} />
      </FormItem>
      <FormItem label="Public">
        <Switch {...renameKey(register("isPublic"))} />
      </FormItem>
      <FormItem col label="Category">
        <Select empty options={props.categoryOptions} {...renameKey(register("category"))} />
      </FormItem>
      <FormItem col label="id">
        {props.deck.id}
      </FormItem>
      <FormItem label="Created At">{new Date(props.deck.createdAt).toLocaleDateString()}</FormItem>
      <FormItem label="Updated At">{new Date(props.deck.updatedAt).toLocaleDateString()}</FormItem>
      <Button primary type="submit" disabled={formState.isSubmitting}>
        Save
      </Button>
    </Form>
  );
};
