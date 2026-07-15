import type { Meta, StoryObj } from "@storybook/react";

import { ConfigForm as Template, type ConfigFormFields } from "@/features/settings/components/ConfigForm";
import * as fixture from "@/shared/storybook/fixture";

const fields: ConfigFormFields = {
  showHeader: { checked: fixture.config.default.showHeader, onChange: () => undefined },
  showSwipeButtonList: { checked: fixture.config.default.showSwipeButtonList, onChange: () => undefined },
  showSwipeFeedback: { checked: fixture.config.default.showSwipeFeedback, onChange: () => undefined },
  darkMode: { checked: fixture.config.default.darkMode, onChange: () => undefined },
  localMode: { checked: fixture.config.default.localMode, onChange: () => undefined },
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

export const Default: Story = {};

export const Logout: Story = {
  args: { isLoggedIn: true },
};
