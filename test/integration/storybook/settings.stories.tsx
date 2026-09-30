import type { StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, within } from "storybook/test";
import { routeMeta, state } from "./support";

const page = {
  ...state,
  path: "/settings",
  preferences: {
    ...state.preferences,
    language: "system" as const,
    study: { ...state.preferences.study, maxNumberOfCardsToLearn: 24, cardInterval: 7, useCardInterval: true },
    controls: {
      ...state.preferences.controls,
      showCardDetails: true,
      showSkip: true,
      showBackTextSwipeOverlays: false,
    },
  },
};
const meta = { ...routeMeta, title: "Integration/Settings", parameters: { ...routeMeta.parameters, page } };
export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-SETTINGS-01 Keep System selected while following the Japanese browser language", async () => {
      await expect(await canvas.findByRole("heading", { name: "設定" })).toBeVisible();
      await expect(canvas.getByRole("combobox", { name: "言語" })).toHaveDisplayValue("System");
      await expect(document.documentElement).toHaveAttribute("lang", "ja");
    });
    await step("STORYBOOK-SETTINGS-08 Expose localized control names and slider values", async () => {
      await expect(canvas.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" })).toBeVisible();
      await expect(canvas.getByRole("checkbox", { name: "ダークモード" })).toBeVisible();
      await expect(canvas.getByRole("slider", { name: "最大カード数" })).toHaveAttribute("aria-valuetext", "24枚");
      await expect(canvas.getByRole("slider", { name: "自動再生の間隔" })).toHaveAttribute("aria-valuetext", "7秒");
    });
  },
};
export const Controls: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-SETTINGS-02 Toggle playback visibility in both directions", async () => {
      const control = await canvas.findByRole("checkbox", { name: "Show playback controls" });
      await expect(control).toBeChecked();
      await userEvent.click(control);
      await expect(control).not.toBeChecked();
      await userEvent.click(control);
      await expect(control).toBeChecked();
    });
    await step("STORYBOOK-SETTINGS-03 Toggle swipe visibility independently", async () => {
      const control = canvas.getByRole("checkbox", { name: "Show swipe controls" });
      await expect(control).toBeChecked();
      await userEvent.click(control);
      await expect(control).not.toBeChecked();
      await expect(canvas.getByRole("checkbox", { name: "Show playback controls" })).toBeChecked();
      await expect(canvas.getByRole("checkbox", { name: "Show card details" })).toBeChecked();
    });
  },
};
export const Structure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-SETTINGS-04 Keep account operations outside settings", async () => {
      await expect(await canvas.findByRole("heading", { name: "Settings" })).toBeVisible();
      for (const name of ["Language", "Appearance", "Study"])
        await expect(canvas.getByRole("region", { name })).toBeVisible();
      await expect(canvas.getByText("Advanced", { exact: true })).toBeVisible();
      await expect(canvas.getByText("Changes are saved automatically")).toBeVisible();
      await expect(canvas.queryByText("User ID")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("button", { name: /Sign in|Sign out/ })).not.toBeInTheDocument();
    });
    await step("STORYBOOK-SETTINGS-06 Show review guidance and build metadata", async () => {
      const schedule = canvas.getByRole("checkbox", { name: "Respect review schedule" });
      await expect(schedule).toBeChecked();
      await expect(schedule).toHaveAccessibleDescription("Hide cards until their next review time");
      await expect(canvas.getByRole("slider", { name: "Autoplay interval" })).toHaveAttribute(
        "aria-valuetext",
        "7 seconds"
      );
      await userEvent.click(canvas.getByText("Advanced", { exact: true }));
      await expect(canvas.getByText("1.2.3")).toBeVisible();
      await expect(canvas.getByRole("link", { name: "0123456" })).toHaveAttribute(
        "href",
        "https://github.com/her0e1c1/tango/commit/0123456789abcdef0123456789abcdef01234567"
      );
    });
    await step("STORYBOOK-SETTINGS-07 Associate labels, explanations, and section headings", async () => {
      for (const name of ["Language", "Appearance", "Study"]) {
        const region = canvas.getByRole("region", { name });
        await expect(region).toHaveAttribute("aria-labelledby", within(region).getByRole("heading", { name }).id);
        for (const icon of region.querySelectorAll("svg"))
          await expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
      }
      await expect(canvas.getByRole("checkbox", { name: "Dark mode" })).toHaveAccessibleDescription(
        "Use the darker Calm Focus palette"
      );
    });
  },
};
export const LanguageAndInputs: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-SETTINGS-05 Apply language and control changes through the Page model", async () => {
      await userEvent.selectOptions(await canvas.findByRole("combobox", { name: "Language" }), "ja");
      await expect(await canvas.findByRole("heading", { name: "設定" })).toBeVisible();
      await expect(canvas.getByRole("combobox", { name: "言語" })).toHaveValue("ja");
      for (const name of ["再生コントロールを表示", "カードの詳細を表示", "スキップ操作を表示"]) {
        const control = canvas.getByRole("checkbox", { name });
        await userEvent.click(control);
        await expect(control).not.toBeChecked();
      }
      const overlays = canvas.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" });
      await userEvent.click(overlays);
      await expect(overlays).toBeChecked();
      await expect(overlays).toHaveAccessibleDescription("回答の表示中に左右の学習操作を表示します");
      const maximum = canvas.getByRole("slider", { name: "最大カード数" });
      await fireEvent.change(maximum, { target: { value: "31" } });
      await expect(maximum).toHaveAttribute("aria-valuetext", "31枚");
      await expect(maximum).toHaveValue("31");
    });
  },
};
function maximumStory(japanese: boolean): Story {
  return {
    parameters: {
      locale: japanese ? "ja" : "en",
      page: {
        ...page,
        preferences: { ...page.preferences, study: { ...page.preferences.study, maxNumberOfCardsToLearn: 0 } },
      },
    },
    play: async ({ canvas, step }) => {
      await step("STORYBOOK-SETTINGS-09 Describe all matching cards at zero", async () => {
        const slider = await canvas.findByRole("slider", { name: japanese ? "最大カード数" : "Maximum cards" });
        await expect(slider).toHaveAttribute("min", "0");
        await expect(slider).toHaveAttribute("max", "100");
        await expect(slider).toHaveAccessibleDescription(
          japanese ? /0 は.*すべてのカード/ : /0 includes all cards matching tags/
        );
        for (const value of [0, 1, 2, 0]) {
          await fireEvent.change(slider, { target: { value: String(value) } });
          const text =
            value === 0
              ? japanese
                ? "条件に一致するすべてのカード"
                : "All matching cards"
              : japanese
                ? `${value}枚`
                : `${value} ${value === 1 ? "card" : "cards"}`;
          await expect(slider).toHaveAttribute("aria-valuetext", text);
          await expect(canvas.getByText(value === 0 ? text : String(value), { exact: true })).toBeVisible();
        }
      });
    },
  };
}
export const Maximum = maximumStory(false);
export const JapaneseMaximum = maximumStory(true);
function intervalStory(japanese: boolean, autoPlay: boolean, playback: boolean): Story {
  return {
    parameters: {
      locale: japanese ? "ja" : "en",
      page: {
        ...page,
        preferences: {
          ...page.preferences,
          study: { ...page.preferences.study, cardInterval: 60, defaultAutoPlay: autoPlay },
          controls: { ...page.preferences.controls, showPlaybackControls: playback },
        },
      },
    },
    play: async ({ canvas, step }) => {
      await step("STORYBOOK-SETTINGS-10 Describe interval boundaries without changing other settings", async () => {
        const slider = await canvas.findByRole("slider", { name: japanese ? "自動再生の間隔" : "Autoplay interval" });
        await expect(slider).toHaveAttribute("min", "0");
        await expect(slider).toHaveAttribute("max", "60");
        for (const value of [0, 1, 60]) {
          await fireEvent.change(slider, { target: { value: String(value) } });
          const text =
            value === 0
              ? japanese
                ? "自動送りなし（0秒）"
                : "No automatic advance (0 seconds)"
              : japanese
                ? `${value}秒`
                : `${value} ${value === 1 ? "second" : "seconds"}`;
          await expect(slider).toHaveAttribute("aria-valuetext", text);
          await expect(
            canvas.getByText(
              value === 0 ? (japanese ? text : "No automatic advance (0s)") : japanese ? text : `${value}s`,
              { exact: true }
            )
          ).toBeVisible();
          await expect(
            canvas.getByRole<HTMLInputElement>("checkbox", { name: japanese ? "自動再生で開始" : "Start autoplay" })
              .checked
          ).toBe(autoPlay);
          await expect(
            canvas.getByRole<HTMLInputElement>("checkbox", {
              name: japanese ? "再生コントロールを表示" : "Show playback controls",
            }).checked
          ).toBe(playback);
        }
        await expect(slider).toHaveAccessibleDescription(
          japanese ? /0秒では自動送りを行わず/ : /At 0, cards do not advance automatically/
        );
      });
    },
  };
}
export const IntervalOffHidden = intervalStory(false, false, false);
export const IntervalOffVisible = intervalStory(false, false, true);
export const IntervalOnHidden = intervalStory(false, true, false);
export const IntervalOnVisible = intervalStory(false, true, true);
export const JapaneseIntervalOffHidden = intervalStory(true, false, false);
export const JapaneseIntervalOffVisible = intervalStory(true, false, true);
export const JapaneseIntervalOnHidden = intervalStory(true, true, false);
export const JapaneseIntervalOnVisible = intervalStory(true, true, true);
export const Home: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-SETTINGS-11 Navigate home using the shortcut", async () => {
      await canvas.findByRole("heading", { name: "Settings" });
      await userEvent.keyboard("t");
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
    });
  },
};
