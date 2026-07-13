import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@src/shared/storybook/storybookViewports";
import type { CardFormFields } from "@src/features/card/components/CardForm";
import { CardFormTemplate as Template } from "@src/features/card/components/templates/CardFormTemplate";
import * as fixture from "@src/shared/storybook/fixture";

const fields: CardFormFields = {
  frontText: { value: fixture.card.default.frontText, onChange: () => undefined },
  backText: { value: fixture.card.default.backText, onChange: () => undefined },
  tags: fixture.form.options.default.map(({ label, value }) => ({
    label,
    value,
    input: { name: "tags", value, checked: false, onChange: () => undefined },
  })),
};

const meta = {
  title: "Card/CardFormTemplate",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    cardForm: {
      card: fixture.card.default,
      fields,
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
