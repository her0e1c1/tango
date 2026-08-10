/**
 * @file Defines Storybook examples for the Settings Page view.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import type { ConfigFormFields } from "@/features/settings";
import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { SettingsView as Template } from "./SettingsView";

const fields: ConfigFormFields = {
  showHeader: { checked: fixture.config.default.showHeader, onChange: () => undefined },
  showSwipeButtonList: { checked: fixture.config.default.showSwipeButtonList, onChange: () => undefined },
  showSwipeFeedback: { checked: fixture.config.default.showSwipeFeedback, onChange: () => undefined },
  darkMode: { checked: fixture.config.default.darkMode, onChange: () => undefined },
  shuffled: { checked: fixture.config.default.shuffled, onChange: () => undefined },
  useCardInterval: { checked: fixture.config.default.useCardInterval, onChange: () => undefined },
  maxNumberOfCardsToLearn: {
    value: String(fixture.config.default.maxNumberOfCardsToLearn),
    min: 0,
    max: 100,
    onChange: () => undefined,
  },
  defaultAutoPlay: { checked: fixture.config.default.defaultAutoPlay, onChange: () => undefined },
  cardInterval: {
    value: String(fixture.config.default.cardInterval),
    min: 0,
    max: 60,
    onChange: () => undefined,
  },
};

const meta = {
  title: "Pages/Settings",
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
    configForm: {
      config: fixture.config.default,
      fields,
      maxNumberOfCardsToLearn: fixture.config.default.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.default.cardInterval,
      version: "1.2.3",
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};

export const LoggedIn: Story = {
  args: {
    configForm: {
      isLoggedIn: true,
      identity: { uid: "settings-user", displayName: "Settings User" },
      config: fixture.config.default,
      fields,
      maxNumberOfCardsToLearn: fixture.config.default.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.default.cardInterval,
      version: "1.2.3",
    },
  },
};

export const LongContent: Story = {
  args: {
    configForm: {
      isLoggedIn: true,
      identity: {
        uid: "settings-user-with-an-intentionally-long-identifier-for-responsive-review-1234567890",
        displayName: "A settings user with an intentionally long display name for responsive review",
      },
      config: fixture.config.longUserName,
      fields,
      maxNumberOfCardsToLearn: fixture.config.longUserName.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.longUserName.cardInterval,
      version: "2026.07.16-calm-focus-settings-presentation-long-metadata",
    },
  },
};

export const Dark: Story = {
  ...LoggedIn,
  globals: { theme: "dark" },
};

export const Mobile: Story = {
  ...LongContent,
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
