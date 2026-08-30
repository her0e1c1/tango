import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "react-hook-form";
import { expect } from "storybook/test";

import { studyPreferencesLimits, type Preferences } from "@/entities/preference";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { SettingsForm } from "./SettingsForm";

interface SettingsFormStoryProps {
  preferences: Preferences;
  version: string;
  commitHash: string;
  repositoryUrl: string;
}

const SettingsFormStory = ({ preferences, version, commitHash, repositoryUrl }: SettingsFormStoryProps) => {
  const form = useForm<Preferences>({ defaultValues: preferences });
  return (
    <SettingsForm
      form={form}
      studyPreferencesLimits={studyPreferencesLimits}
      version={version}
      commitHash={commitHash}
      repositoryUrl={repositoryUrl}
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
    repositoryUrl: "https://github.com/her0e1c1/tango",
  },
} satisfies Meta<typeof SettingsFormStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Interaction: Story = {
  play: async ({ canvas, userEvent }) => {
    const playback = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Show playback controls" });
    const initialValue = playback.checked;
    await userEvent.click(playback);
    await expect(playback.checked).toBe(!initialValue);
  },
};
export const LongContent: Story = {
  args: { version: "2026.07.16-calm-focus-settings-presentation-long-metadata" },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
