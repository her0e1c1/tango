import type { Meta, StoryObj } from "@storybook/react";

import { ConfigForm as Template, type ConfigFormFields } from "@/features/settings/components/ConfigForm";
import * as fixture from "@/storybook/fixture";

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
  githubAccessToken: { value: fixture.config.default.githubAccessToken, onChange: () => undefined },
};

const longFields: ConfigFormFields = {
  ...fields,
  githubAccessToken: {
    value: "github_pat_story_token_with_an_intentionally_long_value_for_responsive_review_1234567890",
    onChange: () => undefined,
  },
};

const meta = {
  title: "Settings/ConfigForm",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onLogin: { action: "onLogin" },
    onLogout: { action: "onLogout" },
  },
  args: {
    config: fixture.config.default,
    fields,
    maxNumberOfCardsToLearn: fixture.config.default.maxNumberOfCardsToLearn,
    cardInterval: fixture.config.default.cardInterval,
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
    fields: longFields,
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
