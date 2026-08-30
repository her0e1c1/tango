import type * as React from "react";
import { useId } from "react";
import { type UseFormReturn, useFormState } from "react-hook-form";

import { TagList } from "@/shared/ui/content";
import { FormItem, Tag, Textarea } from "@/shared/ui/forms";

export interface CardFormFields {
  frontText: string;
  backText: string;
  tags: string[];
}

export interface CardFieldsProps {
  categories: readonly string[];
  form: UseFormReturn<CardFormFields>;
}

export const CardFields: React.FC<CardFieldsProps> = (props) => {
  const formState = useFormState({ control: props.form.control });
  const sectionHeadingIdPrefix = useId();
  const frontHeadingId = `${sectionHeadingIdPrefix}-card-front-heading`;
  const backHeadingId = `${sectionHeadingIdPrefix}-card-back-heading`;
  const tagsHeadingId = `${sectionHeadingIdPrefix}-card-tags-heading`;
  const frontInputId = `${sectionHeadingIdPrefix}-card-front-text`;
  const frontErrorId = `${frontInputId}-error`;
  const backInputId = `${sectionHeadingIdPrefix}-card-back-text`;
  const backErrorId = `${backInputId}-error`;

  return (
    <>
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
        <FormItem
          col
          label="Front text"
          inputId={frontInputId}
          errorId={frontErrorId}
          {...(formState.errors.frontText?.message !== undefined ? { error: formState.errors.frontText.message } : {})}
        >
          <Textarea
            rows={8}
            {...props.form.register("frontText")}
            id={frontInputId}
            aria-invalid={formState.errors.frontText != null || undefined}
            aria-describedby={formState.errors.frontText !== undefined ? frontErrorId : undefined}
          />
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
        <FormItem
          col
          label="Back text"
          inputId={backInputId}
          errorId={backErrorId}
          {...(formState.errors.backText?.message !== undefined ? { error: formState.errors.backText.message } : {})}
        >
          <Textarea
            rows={8}
            {...props.form.register("backText")}
            id={backInputId}
            aria-invalid={formState.errors.backText != null || undefined}
            aria-describedby={formState.errors.backText !== undefined ? backErrorId : undefined}
          />
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
          {props.categories.map((category) => (
            <Tag
              className="mr-1 mb-1"
              primary
              small
              key={category}
              label={category}
              {...props.form.register("tags")}
              value={category}
            />
          ))}
        </TagList>
      </section>
    </>
  );
};
