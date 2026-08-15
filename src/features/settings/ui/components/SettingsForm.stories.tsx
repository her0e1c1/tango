import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { SettingsForm as Form } from "./SettingsForm";

type SettingsFields = ComponentProps<typeof Form>["fields"];

const fields: SettingsFields = {
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

const settingsFormProps = {
  fields,
  maxNumberOfCardsToLearn: fixture.preferences.default.study.maxNumberOfCardsToLearn,
  cardInterval: fixture.preferences.default.study.cardInterval,
};

const meta = {
  title: "Features/Settings/SettingsForm",
  component: Form,
  tags: ["autodocs"],
  parameters: { viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" } },
  args: settingsFormProps,
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "iphonex" } } };
