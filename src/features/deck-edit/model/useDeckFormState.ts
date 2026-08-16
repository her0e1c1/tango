import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, deckFormSchema, editDeck, type DeckId, useDeck } from "@/entities/deck";
import type { Form, Input, Select, Switch } from "@/shared/ui/forms";

interface DeckFormFields {
  name: React.ComponentProps<typeof Input>;
  convertToBr: React.ComponentProps<typeof Switch>;
  url: React.ComponentProps<typeof Input>;
  category: React.ComponentProps<typeof Select>;
}

export interface DeckFormProps {
  deckInfo: {
    id: DeckId;
    createdAt?: string;
    updatedAt?: string;
  };
  fields: DeckFormFields;
  errors: {
    name: string | undefined;
    url: string | undefined;
  };
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: NonNullable<React.ComponentProps<typeof Form>["onSubmit"]>;
}

type DeckFormValues = z.infer<typeof deckFormSchema>;

interface UseDeckFormStateOptions {
  deckId: string;
  onCancel: () => void;
  onSaved: () => void;
}

export const useDeckFormState = ({ deckId, onCancel, onSaved }: UseDeckFormStateOptions) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register } = useForm<DeckFormValues>({
    ...(deck && {
      defaultValues: {
        name: deck.name,
        category: deck.category,
        url: deck.url || undefined,
        convertToBr: deck.convertToBr,
      },
    }),
    resolver: zodResolver(deckFormSchema),
  });

  if (deck == null) return;

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await editDeck(uid, { id: deck.id, ...values, url: values.url ?? null });
      onSaved();
    } catch (error) {
      setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  const form: DeckFormProps = {
    deckInfo: {
      id: deck.id,
      ...(deck.createdAt ? { createdAt: new Date(deck.createdAt).toLocaleDateString() } : {}),
      ...(deck.updatedAt ? { updatedAt: new Date(deck.updatedAt).toLocaleDateString() } : {}),
    },
    fields: {
      name: register("name"),
      convertToBr: register("convertToBr"),
      // Keep optional Deck URLs absent even though an empty HTML input reports an empty string.
      url: register("url", { setValueAs: (value: unknown) => (value === "" ? undefined : value) }),
      category: {
        ...register("category"),
        options: CATEGORY.map((category) => ({ label: category, value: category })),
      },
    },
    errors: {
      name: formState.errors.name?.message,
      url: formState.errors.url?.message,
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: onFormSubmit,
  };

  return { deckName: deck.name, form, saveError };
};
