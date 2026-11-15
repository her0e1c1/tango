import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";

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
};
export const Interaction: Story = {};
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

export const SettingsContracts: Story = {
  args: {
    preferences: {
      ...fixture.preferences.default,
      controls: {
        ...fixture.preferences.default.controls,
        showPlaybackControls: true,
        showCardDetails: true,
        showSkip: true,
        showBackTextSwipeOverlays: false,
      },
      study: {
        ...fixture.preferences.default.study,
        maxNumberOfCardsToLearn: 24,
        cardInterval: 7,
        useCardInterval: true,
      },
    },
  },
};

export const JapaneseValues: Story = {
  args: SettingsContracts.args ?? {},
  parameters: { locale: "ja" },
};

export const MultipleForms: Story = {
  // This fixture intentionally repeats a whole screen to check generated label IDs.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: (args) => (
    <>
      <section aria-label="First settings">
        <SettingsFormStory {...args} />
      </section>
      <section aria-label="Second settings">
        <SettingsFormStory {...args} />
      </section>
    </>
  ),
};

const maximumCardsStory = (japanese: boolean): Story => {
  return {
    args: AllMatchingCards.args ?? {},
    parameters: { locale: japanese ? "ja" : "en" },
  };
};
export const MaximumCardsBoundary = maximumCardsStory(false);
export const MaximumCardsBoundaryJapanese = maximumCardsStory(true);

const intervalStory = (japanese: boolean, autoPlay: boolean, playback: boolean): Story => {
  return {
    parameters: { locale: japanese ? "ja" : "en" },
    args: {
      preferences: {
        ...fixture.preferences.default,
        study: { ...fixture.preferences.default.study, cardInterval: 60, defaultAutoPlay: autoPlay },
        controls: { ...fixture.preferences.default.controls, showPlaybackControls: playback },
      },
    },
  };
};
export const IntervalOffHidden = intervalStory(false, false, false);
export const IntervalOffVisible = intervalStory(false, false, true);
export const IntervalOnHidden = intervalStory(false, true, false);
export const IntervalOnVisible = intervalStory(false, true, true);
export const JapaneseIntervalOffHidden = intervalStory(true, false, false);
export const JapaneseIntervalOffVisible = intervalStory(true, false, true);
export const JapaneseIntervalOnHidden = intervalStory(true, true, false);
export const JapaneseIntervalOnVisible = intervalStory(true, true, true);

export const Tablet: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>("summary")?.click();
  },
  parameters: { locale: "ja" },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>("summary")?.click();
  },
  ...LongContent,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>("summary")?.click();
  },
  ...LongContent,
  parameters: { locale: "ja" },
  args: {
    ...LongContent.args,
    preferences: {
      ...fixture.preferences.default,
      study: { ...fixture.preferences.default.study, maxNumberOfCardsToLearn: 0, cardInterval: 0 },
    },
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
