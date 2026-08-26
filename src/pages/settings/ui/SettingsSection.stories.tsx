import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { Switch } from "@/shared/ui/forms";

import { SettingsRow, SettingsSection, type SettingsSectionProps } from "./SettingsSection";

const inputId = "storybook-show-swipe-controls";
const onShowSwipeControlsChange = fn();

const SettingsSectionStory = (args: SettingsSectionProps) => {
  const [showSwipeControls, setShowSwipeControls] = useState(true);

  return (
    <SettingsSection {...args}>
      <SettingsRow inputId={inputId} label="Show swipe controls" description="Display study swipe action controls">
        <Switch
          id={inputId}
          checked={showSwipeControls}
          aria-describedby={`${inputId}-description`}
          onChange={(event) => {
            onShowSwipeControlsChange(event);
            setShowSwipeControls(event.target.checked);
          }}
        />
      </SettingsRow>
      <SettingsRow
        inputId="storybook-swipe-feedback"
        label="Show swipe feedback"
        description="Confirm each study action on screen"
      >
        <Switch id="storybook-swipe-feedback" checked={false} onChange={fn()} />
      </SettingsRow>
    </SettingsSection>
  );
};

const meta = {
  title: "Pages/Settings/SettingsSection",
  component: SettingsSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withPageLayout],
  args: {
    title: "Appearance",
    description: "Study controls and visual feedback",
    icon: <AiOutlineEye />,
    children: (
      <SettingsRow inputId={inputId} label="Show swipe controls" description="Display study swipe action controls">
        <Switch id={inputId} checked onChange={fn()} />
      </SettingsRow>
    ),
  },
} satisfies Meta<typeof SettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultipleRows: Story = {
  render: (args) => <SettingsSectionStory {...args} />,
};

export const Row: Story = {
  render: () => (
    <SettingsRow inputId="storybook-dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
      <Switch id="storybook-dark-mode" checked onChange={fn()} />
    </SettingsRow>
  ),
};

export const Interaction: Story = {
  render: (args) => <SettingsSectionStory {...args} />,
  play: async ({ canvas, userEvent }) => {
    const control = canvas.getByRole("checkbox", { name: "Show swipe controls" });
    await userEvent.click(control);
    await expect(control).not.toBeChecked();
    await expect(onShowSwipeControlsChange).toHaveBeenCalledOnce();
  },
};

export const LongContent: Story = {
  args: {
    title: "An unusually long settings section title that wraps without hiding its controls",
    description: "A detailed explanation that remains readable on narrow screens and at larger text sizes.".repeat(2),
    children: (
      <SettingsRow
        inputId="storybook-long-setting"
        label="A setting with a long label that wraps naturally"
        description="A longer setting description explains the effect without pushing the control outside the row."
      >
        <Switch id="storybook-long-setting" checked onChange={fn()} />
      </SettingsRow>
    ),
  },
};

export const Mobile: Story = {
  ...LongContent,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  ...MultipleRows,
  globals: { theme: "dark" },
};
