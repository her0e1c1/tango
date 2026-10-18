import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { expect, fireEvent, within } from "storybook/test";

import { studyPreferencesLimits, type Preferences } from "@/entities/preference";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { getSettingsFormValues, type SettingsFormValues } from "../model/queries/getSettingsFormValues";
import { SettingsForm } from "./SettingsForm";

interface SettingsFormStoryProps {
  preferences: Preferences;
  version: string;
  commitHash: string;
}

const SettingsFormStory = ({ preferences, version, commitHash }: SettingsFormStoryProps) => {
  const form = useForm<SettingsFormValues>({ defaultValues: getSettingsFormValues(preferences) });
  return (
    <SettingsForm
      form={form}
      studyPreferencesLimits={studyPreferencesLimits}
      version={version}
      commitHash={commitHash}
    />
  );
};

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Pages/Settings/SettingsForm",
  component: SettingsFormStory,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    preferences: fixture.preferences.default,
    version: "1.2.3",
    commitHash: "0123456789abcdef0123456789abcdef01234567",
  },
} satisfies Meta<typeof SettingsFormStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Japanese: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-SETTINGS-01 Japanese settings", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(document.documentElement).toHaveAttribute("lang", "ja");
      await expect(canvas.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
      await expect(canvas.getByRole("combobox", { name: "言語" })).toHaveDisplayValue("System");
    });
  },
};
export const Interaction: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-SETTINGS-02 Toggle playback controls", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const playback = canvas.getByRole<HTMLInputElement>("checkbox", { name: "Show playback controls" });
      const initialValue = playback.checked;
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(playback);
      // Then: Verify the expected result in the assertions below.
      await expect(playback.checked).toBe(!initialValue);
    });
  },
};
export const LongContent: Story = {
  args: { version: "2026.07.16-calm-focus-settings-presentation-long-metadata" },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = { ...LongContent, globals: { viewport: { value: "iphonex", isRotated: false } } };

export const AllMatchingCards: Story = {
  args: {
    preferences: {
      ...fixture.preferences.default,
      study: { ...fixture.preferences.default.study, maxNumberOfCardsToLearn: 0 },
    },
  },
};
export const AllMatchingCardsJapaneseMobile: Story = {
  ...AllMatchingCards,
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const SettingsContracts: Story = {
  args: {
    preferences: {
      ...fixture.preferences.default,
      controls: {
        ...fixture.preferences.default.controls,
        showPlaybackControls: true,
        showCardDetails: true,
        showSkip: true,
        showBackTextSwipeOverlays: false,
      },
      study: {
        ...fixture.preferences.default.study,
        maxNumberOfCardsToLearn: 24,
        cardInterval: 7,
        useCardInterval: true,
      },
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-SETTINGS-04 Separate settings from account controls", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Evaluate `canvas.getByRole` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("heading", { name: "Settings" })).toBeVisible();
      await expect(canvas.getByText("Changes are saved automatically")).toBeVisible();
      for (const name of ["Language", "Appearance", "Study"])
        await expect(canvas.getByRole("region", { name })).toBeVisible();
      await expect(canvas.getByText("Advanced", { exact: true })).toBeVisible();
      await expect(canvas.queryByRole("form")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("region", { name: "Account" })).not.toBeInTheDocument();
      await expect(canvas.queryByText("User ID")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("button", { name: /log in|log out|sign in|sign out/i })).not.toBeInTheDocument();
    });
    await step("STORYBOOK-SETTINGS-06 Explain the review schedule and version", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const schedule = canvas.getByRole("checkbox", { name: "Respect review schedule" });
      await expect(schedule).toBeChecked();
      await expect(schedule).toHaveAccessibleDescription("Hide cards until their next review time");
      await expect(canvas.getByRole("slider", { name: "Autoplay interval" })).toHaveAttribute(
        "aria-valuetext",
        "7 seconds"
      );
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByText("Advanced", { exact: true }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText("1.2.3")).toBeVisible();
      await expect(canvas.getByRole("link", { name: "0123456" })).toHaveAttribute(
        "href",
        `https://github.com/her0e1c1/tango/commit/${meta.args.commitHash}`
      );
      await expect(canvas.queryByText("Main branch")).not.toBeInTheDocument();
    });
    await step("STORYBOOK-SETTINGS-05 Reflect edited values in the form", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const language = canvas.getByRole("combobox", { name: "Language" });
      // When: Exercise `userEvent.selectOptions` with the prepared inputs.
      await userEvent.selectOptions(language, "ja");
      // Then: Verify the expected result in the assertions below.
      await expect(language).toHaveValue("ja");
      await expect(language).toHaveDisplayValue("日本語");
      for (const name of [
        "Show playback controls",
        "Show card details",
        "Show skip control",
        "Show back text swipe overlays",
      ]) {
        // Given: Prepare `control`, `previous` and any shared test state below.
        // When: Exercise `canvas.getByRole` with the prepared inputs.
        const control = canvas.getByRole<HTMLInputElement>("checkbox", { name });
        const previous = control.checked;
        await userEvent.click(control);
        // Then: Verify the expected result in the assertions below.
        await expect(control.checked).toBe(!previous);
      }
      await expect(canvas.getByRole("checkbox", { name: "Show back text swipe overlays" })).toHaveAccessibleDescription(
        "Display left and right study actions while viewing an answer"
      );
      const maximum = canvas.getByRole("slider", { name: "Maximum cards" });
      // When: Exercise `fireEvent.change` with the prepared inputs.
      await fireEvent.change(maximum, { target: { value: "31" } });
      // Then: Verify the expected result in the assertions below.
      await expect(maximum).toHaveValue("31");
      await expect(maximum).toHaveAttribute("aria-valuetext", "31 cards");
      await expect(canvas.getByText("31", { exact: true })).toBeVisible();
    });
  },
};

export const JapaneseValues: Story = {
  args: SettingsContracts.args ?? {},
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-SETTINGS-08 Localize accessible control names and values", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Evaluate `canvas.getByRole` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" })).toBeVisible();
      await expect(canvas.getByRole("checkbox", { name: "ダークモード" })).toBeVisible();
      await expect(canvas.getByRole("slider", { name: "最大カード数" })).toHaveAttribute("aria-valuetext", "24枚");
      await expect(canvas.getByRole("slider", { name: "自動再生の間隔" })).toHaveAttribute("aria-valuetext", "7秒");
    });
  },
};

export const MultipleForms: Story = {
  // This fixture intentionally repeats a whole screen to check generated label IDs.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: (args) => (
    <>
      <section aria-label="First settings">
        <SettingsFormStory {...args} />
      </section>
      <section aria-label="Second settings">
        <SettingsFormStory {...args} />
      </section>
    </>
  ),
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-SETTINGS-07 Associate each form section with its own heading", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      for (const name of ["Language", "Appearance", "Study"]) {
        // Given: Prepare `regions` and any shared test state below.
        const regions = canvas.getAllByRole("region", { name });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await expect(regions).toHaveLength(2);
        for (const region of regions) {
          // Given: Prepare `heading` and any shared test state below.
          // When: Exercise `within(region).getByRole` with the prepared inputs.
          const heading = within(region).getByRole("heading", { name });
          // Then: Verify the expected result in the assertions below.
          await expect(region).toHaveAttribute("aria-labelledby", heading.id);
        }
      }
      for (const region of canvas.getAllByRole("region", { name: "Appearance" })) {
        // Given: Use the current iteration or branch inputs from the enclosing case.
        await expect(within(region).getByRole("checkbox", { name: "Dark mode" })).toHaveAccessibleDescription(
          "Use the darker Calm Focus palette"
        );
        for (const icon of region.querySelectorAll("svg"))
          await expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
      }
      const languages = canvas.getAllByRole("combobox", { name: "Language" });
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await expect(languages[0]?.id).not.toBe(languages[1]?.id);
    });
  },
};

const maximumCardsStory = (japanese: boolean): Story => {
  // Given: Prepare `copy` and any shared test state below.
  const copy = japanese
    ? {
        label: "最大カード数",
        all: "条件に一致するすべてのカード",
        description: /0 は.*すべてのカード/,
        counts: ["1枚", "2枚"],
      }
    : {
        label: "Maximum cards",
        all: "All matching cards",
        description: /0 includes all cards matching tags and any active review schedule/,
        counts: ["1 card", "2 cards"],
      };
  // When: Evaluate `step` as part of the following checks.
  // Then: Verify the expected result in the assertions below.
  return {
    args: AllMatchingCards.args ?? {},
    parameters: { locale: japanese ? "ja" : "en" },
    play: async ({ canvas, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step("STORYBOOK-SETTINGS-09 Describe zero as all matching cards", async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        const slider = canvas.getByRole("slider", { name: copy.label });
        await expect(slider).toHaveAttribute("min", "0");
        await expect(slider).toHaveAttribute("max", "100");
        await expect(slider).toHaveAccessibleDescription(copy.description);
        for (const value of [0, 1, 2, 0]) {
          // Given: Use the current iteration or branch inputs from the enclosing case.
          // When: Exercise `fireEvent.change` with the prepared inputs.
          await fireEvent.change(slider, { target: { value: String(value) } });
          // Then: Verify the expected result in the assertions below.
          await expect(slider).toHaveAttribute("aria-valuetext", value === 0 ? copy.all : copy.counts[value - 1]);
          await expect(canvas.getByText(value === 0 ? copy.all : String(value), { exact: true })).toBeVisible();
        }
      });
    },
  };
};
export const MaximumCardsBoundary = maximumCardsStory(false);
export const MaximumCardsBoundaryJapanese = maximumCardsStory(true);

const intervalStory = (japanese: boolean, autoPlay: boolean, playback: boolean): Story => {
  // Given: Prepare `copy` and any shared test state below.
  const copy = japanese
    ? {
        label: "自動再生の間隔",
        autoPlay: "自動再生で開始",
        playback: "再生コントロールを表示",
        description: /0秒では自動送りを行わず、再生／一時停止ボタンと進捗スライダーを表示しません/,
        cases: [
          [0, "自動送りなし（0秒）", "自動送りなし（0秒）"],
          [1, "1秒", "1秒"],
          [60, "60秒", "60秒"],
        ] as const,
      }
    : {
        label: "Autoplay interval",
        autoPlay: "Start autoplay",
        playback: "Show playback controls",
        description:
          /At 0, cards do not advance automatically, and the play\/pause button and progress slider are hidden/,
        cases: [
          [0, "No automatic advance (0 seconds)", "No automatic advance (0s)"],
          [1, "1 second", "1s"],
          [60, "60 seconds", "60s"],
        ] as const,
      };
  // When: Evaluate `step` as part of the following checks.
  // Then: Verify the expected result in the assertions below.
  return {
    parameters: { locale: japanese ? "ja" : "en" },
    args: {
      preferences: {
        ...fixture.preferences.default,
        study: { ...fixture.preferences.default.study, cardInterval: 60, defaultAutoPlay: autoPlay },
        controls: { ...fixture.preferences.default.controls, showPlaybackControls: playback },
      },
    },
    play: async ({ canvas, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step("STORYBOOK-SETTINGS-10 Describe interval boundaries independently of playback settings", async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        const slider = canvas.getByRole("slider", { name: copy.label });
        await expect(slider).toHaveAttribute("min", "0");
        await expect(slider).toHaveAttribute("max", "60");
        for (const [value, description, visible] of copy.cases) {
          // Given: Use the current iteration or branch inputs from the enclosing case.
          // When: Exercise `fireEvent.change` with the prepared inputs.
          await fireEvent.change(slider, { target: { value: String(value) } });
          // Then: Verify the expected result in the assertions below.
          await expect(slider).toHaveAttribute("aria-valuetext", description);
          await expect(canvas.getByText(visible, { exact: true })).toBeVisible();
          await expect(canvas.getByRole<HTMLInputElement>("checkbox", { name: copy.autoPlay }).checked).toBe(autoPlay);
          await expect(canvas.getByRole<HTMLInputElement>("checkbox", { name: copy.playback }).checked).toBe(playback);
        }
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await expect(slider).toHaveAccessibleDescription(copy.description);
      });
    },
  };
};
export const IntervalOffHidden = intervalStory(false, false, false);
export const IntervalOffVisible = intervalStory(false, false, true);
export const IntervalOnHidden = intervalStory(false, true, false);
export const IntervalOnVisible = intervalStory(false, true, true);
export const JapaneseIntervalOffHidden = intervalStory(true, false, false);
export const JapaneseIntervalOffVisible = intervalStory(true, false, true);
export const JapaneseIntervalOnHidden = intervalStory(true, true, false);
export const JapaneseIntervalOnVisible = intervalStory(true, true, true);

export const Tablet: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByText("詳細設定", { exact: true }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...LongContent,
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByText("Advanced", { exact: true }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...LongContent,
  parameters: { locale: "ja" },
  args: {
    ...LongContent.args,
    preferences: {
      ...fixture.preferences.default,
      study: { ...fixture.preferences.default.study, maxNumberOfCardsToLearn: 0, cardInterval: 0 },
    },
  },
  play: async (context) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `Tablet.play` with the prepared inputs.
    await Tablet.play?.(context);
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
