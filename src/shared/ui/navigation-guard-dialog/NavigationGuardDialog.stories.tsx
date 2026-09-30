import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { NavigationGuardDialog } from "./NavigationGuardDialog";

const meta = {
  title: "Shared/Router/NavigationGuardDialog",
  component: NavigationGuardDialog,
  tags: ["autodocs"],
  args: {
    onDiscardChanges: fn(),
    onKeepEditing: fn(),
  },
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "400px" } },
  },
} satisfies Meta<typeof NavigationGuardDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = { args: { pending: true } };

export const Mobile: Story = {
  args: {
    description:
      "保存していない変更があります。この画面から移動すると入力した内容が失われます。編集を続けるか、変更を破棄して移動するかを選んでください。",
  },
  parameters: { locale: "ja" },
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const Dark: Story = {
  args: { pending: false },
  argTypes: { pending: { control: "boolean" } },
  ...Default,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const MobileDark: Story = {
  ...Mobile,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...Mobile,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};
