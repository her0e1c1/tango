import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { SettingsForm } from "./SettingsForm";

type SettingsFields = React.ComponentProps<typeof SettingsForm>["fields"];

const fields: SettingsFields = {
  showSwipeButtonList: { checked: fixture.preferences.default.controls.showSwipeButtonList, onChange: fn() },
  showPlaybackControls: { checked: fixture.preferences.default.controls.showPlaybackControls, onChange: fn() },
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
  commitHash: "0123456789abcdef0123456789abcdef01234567",
};

type SwitchFieldName =
  | "showSwipeButtonList"
  | "showPlaybackControls"
  | "showSwipeFeedback"
  | "darkMode"
  | "shuffled"
  | "useCardInterval"
  | "defaultAutoPlay";
type SliderFieldName = "maxNumberOfCardsToLearn" | "cardInterval";

const InteractiveSettingsForm: React.FC<React.ComponentProps<typeof SettingsForm>> = (props) => {
  const [values, setValues] = React.useState({
    showSwipeButtonList: Boolean(props.fields.showSwipeButtonList.checked),
    showPlaybackControls: Boolean(props.fields.showPlaybackControls.checked),
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
        showSwipeButtonList: switchField("showSwipeButtonList"),
        showPlaybackControls: switchField("showPlaybackControls"),
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
    const showPlaybackControls = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Show playback controls" });
    const initialValue = Boolean(args.fields.showPlaybackControls.checked);

    await userEvent.click(showPlaybackControls);

    await expect(args.fields.showPlaybackControls.onChange).toHaveBeenCalledOnce();
    await expect(showPlaybackControls.checked).toBe(!initialValue);
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
