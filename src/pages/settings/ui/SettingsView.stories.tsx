import type { ConfigFormFields } from "@/features/settings";

import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { SettingsView as View } from "./SettingsView";

const fields: ConfigFormFields = {
  showHeader: { checked: fixture.config.default.appearance.showHeader, onChange: () => undefined },
  showSwipeButtonList: { checked: fixture.config.default.controls.showSwipeButtonList, onChange: () => undefined },
  showSwipeFeedback: { checked: fixture.config.default.appearance.showSwipeFeedback, onChange: () => undefined },
  darkMode: { checked: fixture.config.default.appearance.darkMode, onChange: () => undefined },
  shuffled: { checked: fixture.config.default.study.shuffled, onChange: () => undefined },
  useCardInterval: { checked: fixture.config.default.study.useCardInterval, onChange: () => undefined },
  maxNumberOfCardsToLearn: {
    value: String(fixture.config.default.study.maxNumberOfCardsToLearn),
    min: 0,
    max: 100,
    onChange: () => undefined,
  },
  defaultAutoPlay: { checked: fixture.config.default.study.defaultAutoPlay, onChange: () => undefined },
  cardInterval: {
    value: String(fixture.config.default.study.cardInterval),
    min: 0,
    max: 60,
    onChange: () => undefined,
  },
};

const configForm = {
  config: fixture.config.default,
  fields,
  maxNumberOfCardsToLearn: fixture.config.default.study.maxNumberOfCardsToLearn,
  cardInterval: fixture.config.default.study.cardInterval,
  version: "1.2.3",
};

const meta = {
  title: "Pages/Settings",
  component: View,
  tags: ["autodocs"],
  parameters: { viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" } },
  args: { configForm },
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};
export const LoggedIn: Story = {
  args: {
    configForm: {
      ...configForm,
      isLoggedIn: true,
      identity: { uid: "settings-user", displayName: "Settings User" },
    },
  },
};
export const LongContent: Story = {
  args: {
    configForm: {
      ...configForm,
      isLoggedIn: true,
      identity: {
        uid: "settings-user-with-an-intentionally-long-identifier-for-responsive-review-1234567890",
        displayName: "A settings user with an intentionally long display name for responsive review",
      },
      version: "2026.07.16-calm-focus-settings-presentation-long-metadata",
    },
  },
};
export const Dark: Story = { ...LoggedIn, globals: { theme: "dark" } };
export const Mobile: Story = { ...LongContent, parameters: { viewport: { defaultViewport: "iphonex" } } };
