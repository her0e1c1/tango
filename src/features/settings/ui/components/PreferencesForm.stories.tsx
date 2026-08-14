/**
 * @file Defines Storybook examples for Preferences Form.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";

import { PreferencesForm as Template } from "./PreferencesForm";
import * as fixture from "@/storybook/fixture";

type PreferencesFormFields = ComponentProps<typeof Template>["fields"];

const fields: PreferencesFormFields = {
  showHeader: { checked: fixture.preferences.default.appearance.showHeader, onChange: () => undefined },
  showSwipeButtonList: { checked: fixture.preferences.default.controls.showSwipeButtonList, onChange: () => undefined },
  showSwipeFeedback: { checked: fixture.preferences.default.appearance.showSwipeFeedback, onChange: () => undefined },
  darkMode: { checked: fixture.preferences.default.appearance.darkMode, onChange: () => undefined },
  shuffled: { checked: fixture.preferences.default.study.shuffled, onChange: () => undefined },
  useCardInterval: { checked: fixture.preferences.default.study.useCardInterval, onChange: () => undefined },
  maxNumberOfCardsToLearn: {
    value: String(fixture.preferences.default.study.maxNumberOfCardsToLearn),
    min: 0,
    max: 100,
    onChange: () => undefined,
  },
  defaultAutoPlay: { checked: fixture.preferences.default.study.defaultAutoPlay, onChange: () => undefined },
  cardInterval: {
    value: String(fixture.preferences.default.study.cardInterval),
    min: 0,
    max: 60,
    onChange: () => undefined,
  },
};

const meta = {
  title: "Settings/PreferencesForm",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onLogin: { action: "onLogin" },
    onLogout: { action: "onLogout" },
  },
  args: {
    preferences: fixture.preferences.default,
    fields,
    maxNumberOfCardsToLearn: fixture.preferences.default.study.maxNumberOfCardsToLearn,
    cardInterval: fixture.preferences.default.study.cardInterval,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};

export const LoggedIn: Story = {
  args: {
    isLoggedIn: true,
    identity: { uid: "settings-user", displayName: "Settings User" },
    version: "1.2.3",
  },
};

export const LongContent: Story = {
  args: {
    isLoggedIn: true,
    identity: {
      uid: "settings-user-with-an-intentionally-long-identifier-for-responsive-review-1234567890",
      displayName: "A settings user with an intentionally long display name for responsive review",
    },
    fields,
    version: "2026.07.16-calm-focus-settings-presentation-long-metadata",
  },
};

export const Dark: Story = {
  ...LoggedIn,
  globals: { theme: "dark" },
};

export const Mobile: Story = {
  ...LongContent,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
