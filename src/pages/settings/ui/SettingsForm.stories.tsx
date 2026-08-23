import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { SettingsForm } from "./SettingsForm";

type SettingsFields = React.ComponentProps<typeof SettingsForm>["fields"];

const fields: SettingsFields = {
  showHeader: { checked: fixture.preferences.default.appearance.showHeader, onChange: fn() },
  showSwipeButtonList: { checked: fixture.preferences.default.controls.showSwipeButtonList, onChange: fn() },
  showSwipeFeedback: { checked: fixture.preferences.default.appearance.showSwipeFeedback, onChange: fn() },
  darkMode: { checked: fixture.preferences.default.appearance.darkMode, onChange: fn() },
  shuffled: { checked: fixture.preferences.default.study.shuffled, onChange: fn() },
  useCardInterval: { checked: fixture.preferences.default.study.useCardInterval, onChange: fn() },
  maxNumberOfCardsToLearn: {
    value: String(fixture.preferences.default.study.maxNumberOfCardsToLearn),
    min: 0,
    max: 100,
    onChange: fn(),
  },
  defaultAutoPlay: { checked: fixture.preferences.default.study.defaultAutoPlay, onChange: fn() },
  cardInterval: {
    value: String(fixture.preferences.default.study.cardInterval),
    min: 0,
    max: 60,
    onChange: fn(),
  },
};

const settingsFormProps = {
  fields,
  maxNumberOfCardsToLearn: fixture.preferences.default.study.maxNumberOfCardsToLearn,
  cardInterval: fixture.preferences.default.study.cardInterval,
  version: "1.2.3",
};

type SwitchFieldName =
  | "showHeader"
  | "showSwipeButtonList"
  | "showSwipeFeedback"
  | "darkMode"
  | "shuffled"
  | "useCardInterval"
  | "defaultAutoPlay";
type SliderFieldName = "maxNumberOfCardsToLearn" | "cardInterval";

const InteractiveSettingsForm: React.FC<React.ComponentProps<typeof SettingsForm>> = (props) => {
  const [values, setValues] = React.useState({
    showHeader: Boolean(props.fields.showHeader.checked),
    showSwipeButtonList: Boolean(props.fields.showSwipeButtonList.checked),
    showSwipeFeedback: Boolean(props.fields.showSwipeFeedback.checked),
    darkMode: Boolean(props.fields.darkMode.checked),
    shuffled: Boolean(props.fields.shuffled.checked),
    useCardInterval: Boolean(props.fields.useCardInterval.checked),
    defaultAutoPlay: Boolean(props.fields.defaultAutoPlay.checked),
    maxNumberOfCardsToLearn: props.maxNumberOfCardsToLearn,
    cardInterval: props.cardInterval,
  });
  const switchField = (name: SwitchFieldName) => ({
    ...props.fields[name],
    checked: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      props.fields[name].onChange?.(event);
      setValues((current) => ({ ...current, [name]: event.currentTarget.checked }));
    },
  });
  const sliderField = (name: SliderFieldName) => ({
    ...props.fields[name],
    value: String(values[name]),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      props.fields[name].onChange?.(event);
      setValues((current) => ({ ...current, [name]: event.currentTarget.valueAsNumber }));
    },
  });

  return (
    <SettingsForm
      {...props}
      maxNumberOfCardsToLearn={values.maxNumberOfCardsToLearn}
      cardInterval={values.cardInterval}
      fields={{
        showHeader: switchField("showHeader"),
        showSwipeButtonList: switchField("showSwipeButtonList"),
        showSwipeFeedback: switchField("showSwipeFeedback"),
        darkMode: switchField("darkMode"),
        shuffled: switchField("shuffled"),
        useCardInterval: switchField("useCardInterval"),
        defaultAutoPlay: switchField("defaultAutoPlay"),
        maxNumberOfCardsToLearn: sliderField("maxNumberOfCardsToLearn"),
        cardInterval: sliderField("cardInterval"),
      }}
    />
  );
};

const meta = {
  title: "Pages/Settings/SettingsForm",
  component: SettingsForm,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: settingsFormProps,
  render: (args) => <InteractiveSettingsForm {...args} />,
} satisfies Meta<typeof SettingsForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interaction: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const showHeader = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Show header" });
    const initialValue = Boolean(args.fields.showHeader.checked);

    await userEvent.click(showHeader);

    await expect(args.fields.showHeader.onChange).toHaveBeenCalledOnce();
    await expect(showHeader.checked).toBe(!initialValue);
  },
};
export const LongContent: Story = {
  args: {
    ...settingsFormProps,
    version: "2026.07.16-calm-focus-settings-presentation-long-metadata",
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };
