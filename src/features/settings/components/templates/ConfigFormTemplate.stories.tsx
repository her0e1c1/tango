/**
 * @file Defines Storybook examples for Config Form Template.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";
import { ConfigFormTemplate as Template } from "@/features/settings/components/templates/ConfigFormTemplate";
import type { ConfigFormFields } from "@/features/settings/components/ConfigForm";
import * as fixture from "@/storybook/fixture";

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

const meta = {
  title: "Settings/ConfigFormTemplate",
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
      maxNumberOfCardsToLearn: fixture.config.default.study.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.default.study.cardInterval,
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
      maxNumberOfCardsToLearn: fixture.config.default.study.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.default.study.cardInterval,
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
      maxNumberOfCardsToLearn: fixture.config.longUserName.study.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.longUserName.study.cardInterval,
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
