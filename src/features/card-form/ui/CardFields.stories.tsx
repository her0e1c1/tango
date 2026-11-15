import { flushSync } from "react-dom";
import { useCardTagForm } from "@/test/useCardTagForm";
import { useCardPreviewContent } from "../model/queries/useCardPreviewContent";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fn } from "storybook/test";

import { BackText, cardContentInputSchema, type Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { CardFields, type CardFormFields } from "./CardFields";

interface CardFieldsStoryProps {
  card: Card;
  validationError: boolean;
  dark: boolean;
  onSubmit: (values: CardFormFields) => void;
  deckCategory?: string;
  unknownValidationError?: boolean;
}

const validationErrors = { frontText: { type: "custom" }, backText: { type: "custom" } };

const CardFieldsStory = ({
  card,
  validationError,
  dark,
  onSubmit,
  deckCategory = "raw",
  unknownValidationError,
}: CardFieldsStoryProps) => {
  const form = useForm<CardFormFields>({
    resolver: zodResolver(cardContentInputSchema),
    defaultValues: { frontText: card.frontText, backText: card.backText, tags: card.tags },
    ...(validationError
      ? {
          errors: unknownValidationError
            ? { frontText: { type: "unknown", message: "private diagnostic" } }
            : validationErrors,
        }
      : {}),
  });

  const preview = useCardPreviewContent(form.control, deckCategory, dark);
  return (
    <form
      className={`${dark ? "dark" : "light"} bg-surface text-ink`}
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
    >
      <CardFields {...useCardTagForm(form)} availableTags={CATEGORY} preview={<BackText {...preview} />} form={form} />
      <button type="submit">Save</button>
    </form>
  );
};

const longCard = { ...fixture.card.long, tags: [...fixture.tags.toolong] };

const meta = {
  title: "Features/Card Form/CardFields",
  component: CardFieldsStory,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: { card: fixture.card.default, validationError: false, dark: false, onSubmit: fn() },
} satisfies Meta<typeof CardFieldsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const ValidationError: Story = { args: { validationError: true } };
export const LongContent: Story = { args: { card: longCard } };

export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...LongContent, globals: { theme: "dark" } };

export const Empty: Story = { args: { card: { ...fixture.card.default, frontText: "", backText: "", tags: [] } } };
export const Back: Story = {
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
  },
};
export const Expanded: Story = {
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Expand Back"]')?.click();
    });
  },
};
export const ExpandedValidationError: Story = {
  ...Expanded,
  args: { card: { ...fixture.card.default, frontText: "", backText: "" }, validationError: true },
};
export const TagSelection: Story = {
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Edit tags"]')?.click();
    });
  },
};
export const MobileBack: Story = {
  ...Back,
  ...LongContent,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const JapaneseValidation: Story = {
  args: { validationError: true },
  parameters: { locale: "ja" },
};

export const Preview: Story = {
  args: { card: { ...fixture.card.default, backText: "**Draft answer**\n\n$x^2$", tags: ["math"] } },
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
    flushSync(() => {
      Array.from(
        (canvasElement.querySelector('[role="dialog"]') ?? canvasElement).querySelectorAll<HTMLButtonElement>("button")
      )
        .find((button) => button.textContent === "Preview answer")
        ?.click();
    });
  },
};
export const MobilePreview: Story = { ...Preview, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const DarkCodePreview: Story = {
  ...Preview,
  args: { dark: true, card: { ...fixture.card.default, backText: "const answer = 42;", tags: ["typescript"] } },
  globals: { theme: "dark" },
};
export const ExpandedPreview: Story = {
  ...Preview,
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Expand Back"]')?.click();
    });
    flushSync(() => {
      Array.from(
        (canvasElement.querySelector('[role="dialog"]') ?? canvasElement).querySelectorAll<HTMLButtonElement>("button")
      )
        .find((button) => button.textContent === "Preview answer")
        ?.click();
    });
  },
};

export const IncompletePreview: Story = {
  ...Preview,
  args: { card: { ...fixture.card.default, frontText: "", backText: "First\nSecond", tags: ["raw"] } },
};

export const UnknownValidationError: Story = {
  args: {
    validationError: true,
    unknownValidationError: true,
    card: { ...fixture.card.default, frontText: "Front" },
  },
};

function codeThemeStory(deckCategory: string, tags: string[], dark: boolean): Story {
  return {
    ...Preview,
    args: {
      deckCategory,
      dark,
      card: { ...fixture.card.default, tags, backText: "const answer = 42;" },
    },
  };
}
export const DeckPythonPreview = codeThemeStory("python", [], false);
export const TaggedTypescriptPreview = codeThemeStory("math", ["custom", "typescript", "python"], true);
export const TaggedMarkdownPreview = codeThemeStory("math", ["md"], false);

export const Tablet: Story = {
  ...LongContent,
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
    flushSync(() => {
      Array.from(
        (canvasElement.querySelector('[role="dialog"]') ?? canvasElement).querySelectorAll<HTMLButtonElement>("button")
      )
        .find((button) => button.textContent === "Preview answer")
        ?.click();
    });
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...LongContent,
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Expand Back"]')?.click();
    });
    flushSync(() => {
      Array.from(
        (canvasElement.querySelector('[role="dialog"]') ?? canvasElement).querySelectorAll<HTMLButtonElement>("button")
      )
        .find((button) => button.textContent === "Preview answer")
        ?.click();
    });
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: {
    dark: true,
    validationError: true,
    deckCategory: "math",
    card: { ...longCard, tags: [...longCard.tags, "math"], backText: fixture.math.markdown },
  },
  play: ({ canvasElement }) => {
    flushSync(() => {
      canvasElement.querySelector<HTMLButtonElement>('[role="tab"][id$="-backText-tab"]')?.click();
    });
    flushSync(() => {
      Array.from(
        (canvasElement.querySelector('[role="dialog"]') ?? canvasElement).querySelectorAll<HTMLButtonElement>("button")
      )
        .find((button) => button.textContent === "Preview answer")
        ?.click();
    });
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const LandscapeExpanded: Story = {
  ...Desktop,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};
