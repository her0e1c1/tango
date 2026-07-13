import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@src/shared/storybook/storybookViewports";
import { ConfigFormTemplate as Template } from "@src/features/settings/components/templates/ConfigFormTemplate";
import type { ConfigFormFields } from "@src/features/settings/components/ConfigForm";
import * as fixture from "@src/shared/storybook/fixture";

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
      maxNumberOfCardsToLearn: fixture.config.default.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.default.cardInterval,
      version: "1.2.3",
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongUserName: Story = {
  args: {
    configForm: {
      isLoggedIn: true,
      config: fixture.config.longUserName,
      fields,
      maxNumberOfCardsToLearn: fixture.config.longUserName.maxNumberOfCardsToLearn,
      cardInterval: fixture.config.longUserName.cardInterval,
    },
  },
};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
