import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { cardContentSchema, editCard, type CardId, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import type { Form, Option, Tag, Textarea } from "@/shared/ui/forms";

interface CardFormTagField extends Option {
  input: React.ComponentProps<typeof Tag>;
}

interface CardFormFields {
  frontText: React.ComponentProps<typeof Textarea>;
  backText: React.ComponentProps<typeof Textarea>;
  tags: CardFormTagField[];
}

export interface CardFormProps {
  cardInfo: {
    uniqueKey: string;
    id: CardId;
    createdAt?: string;
    lastSeenAt?: string;
  };
  fields: CardFormFields;
  errors: {
    frontText: string | undefined;
    backText: string | undefined;
  };
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: NonNullable<React.ComponentProps<typeof Form>["onSubmit"]>;
}

const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
type CardFormValues = z.infer<typeof cardFormSchema>;

interface UseCardFormStateOptions {
  cardId: string;
  onCancel: () => void;
  onSaved: () => void;
}

export const useCardFormState = ({ cardId, onCancel, onSaved }: UseCardFormStateOptions) => {
  const uid = useAuthUid();
  const card = useCard(cardId);
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register } = useForm<CardFormValues>({
    ...(card && {
      defaultValues: {
        frontText: card.frontText,
        backText: card.backText,
        tags: card.tags,
      },
    }),
    resolver: zodResolver(cardFormSchema),
  });

  if (card == null) return;

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await editCard(uid, { id: card.id, ...values });
      onSaved();
    } catch (error) {
      setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  const form: CardFormProps = {
    cardInfo: {
      id: card.id,
      uniqueKey: card.uniqueKey,
      ...(card.createdAt ? { createdAt: new Date(card.createdAt).toLocaleDateString() } : {}),
      ...(card.lastSeenAt != null ? { lastSeenAt: new Date(card.lastSeenAt).toLocaleDateString() } : {}),
    },
    fields: {
      frontText: register("frontText"),
      backText: register("backText"),
      tags: CATEGORY.map((category) => ({
        label: category,
        value: category,
        input: { ...register("tags"), value: category },
      })),
    },
    errors: {
      frontText: formState.errors.frontText?.message,
      backText: formState.errors.backText?.message,
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: onFormSubmit,
  };

  return { form, saveError };
};
