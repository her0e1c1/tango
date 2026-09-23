import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { expect } from "storybook/test";

import { studyPreferencesLimits, type Preferences } from "@/entities/preference";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { getSettingsFormValues, type SettingsFormValues } from "../model/queries/getSettingsFormValues";
import { SettingsForm } from "./SettingsForm";

interface SettingsFormStoryProps {
  preferences: Preferences;
  version: string;
  commitHash: string;
}

const SettingsFormStory = ({ preferences, version, commitHash }: SettingsFormStoryProps) => {
  const form = useForm<SettingsFormValues>({ defaultValues: getSettingsFormValues(preferences) });
  return (
    <SettingsForm
      form={form}
      studyPreferencesLimits={studyPreferencesLimits}
      version={version}
      commitHash={commitHash}
    />
  );
};

const meta = {
  title: "Pages/Settings/SettingsForm",
  component: SettingsFormStory,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    preferences: fixture.preferences.default,
    version: "1.2.3",
    commitHash: "0123456789abcdef0123456789abcdef01234567",
  },
} satisfies Meta<typeof SettingsFormStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Japanese: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-SETTINGS-01 Japanese settings", async () => {
      await expect(document.documentElement).toHaveAttribute("lang", "ja");
      await expect(canvas.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
      await expect(canvas.getByRole("combobox", { name: "言語" })).toHaveDisplayValue("System");
    });
  },
};
export const Interaction: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-SETTINGS-02 Toggle playback controls", async () => {
      const playback = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Show playback controls" });
      const initialValue = playback.checked;
      await userEvent.click(playback);
      await expect(playback.checked).toBe(!initialValue);
    });
  },
};
export const LongContent: Story = {
  args: { version: "2026.07.16-calm-focus-settings-presentation-long-metadata" },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };

export const AllMatchingCards: Story = {
  args: {
    preferences: {
      ...fixture.preferences.default,
      study: { ...fixture.preferences.default.study, maxNumberOfCardsToLearn: 0 },
    },
  },
};
export const AllMatchingCardsJapaneseMobile: Story = {
  ...AllMatchingCards,
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
