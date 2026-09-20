import type React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { getI18n } from "react-i18next";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { studyPreferencesLimits, type Preferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { SettingsForm } from "./SettingsForm";

const SettingsFormHarness: React.FC<{ values: Preferences }> = ({ values }) => {
  const form = useForm<Preferences>({ defaultValues: values });
  return <SettingsForm form={form} studyPreferencesLimits={studyPreferencesLimits} />;
};

describe.each([
  {
    language: "en",
    intervalLabel: "Autoplay interval",
    autoplayLabel: "Start autoplay",
    playbackLabel: "Show playback controls",
    description:
      "Seconds between cards. At 0, cards do not advance automatically, and the play/pause button and progress slider are hidden.",
    values: [
      { input: "0", visible: "No automatic advance (0s)", spoken: "No automatic advance (0 seconds)" },
      { input: "1", visible: "1s", spoken: "1 second" },
      { input: "60", visible: "60s", spoken: "60 seconds" },
    ],
  },
  {
    language: "ja",
    intervalLabel: "自動再生の間隔",
    autoplayLabel: "自動再生で開始",
    playbackLabel: "再生コントロールを表示",
    description:
      "カードを切り替えるまでの秒数。0秒では自動送りを行わず、再生／一時停止ボタンと進捗スライダーを表示しません。",
    values: [
      { input: "0", visible: "自動送りなし（0秒）", spoken: "自動送りなし（0秒）" },
      { input: "1", visible: "1秒", spoken: "1秒" },
      { input: "60", visible: "60秒", spoken: "60秒" },
    ],
  },
])("SETTINGS-10 Autoplay interval presentation in $language", (copy) => {
  it.each([
    { defaultAutoPlay: true, showPlaybackControls: true },
    { defaultAutoPlay: false, showPlaybackControls: false },
    { defaultAutoPlay: true, showPlaybackControls: false },
    { defaultAutoPlay: false, showPlaybackControls: true },
  ])(
    "explains zero and preserves autoplay=$defaultAutoPlay and playback controls=$showPlaybackControls",
    async ({ defaultAutoPlay, showPlaybackControls }) => {
      await getI18n().changeLanguage(copy.language);
      const preferences = createPreferences({ cardInterval: 60, showPlaybackControls });
      preferences.study.defaultAutoPlay = defaultAutoPlay;
      render(<SettingsFormHarness values={preferences} />);

      const interval = screen.getByRole("slider", { name: copy.intervalLabel });
      expect(interval).toHaveValue("60");
      expect(interval).toHaveAttribute("min", "0");
      expect(interval).toHaveAttribute("max", "60");
      expect(interval).toHaveAccessibleDescription(copy.description);
      expect(screen.getByText(copy.description)).toBeVisible();

      for (const value of copy.values) {
        fireEvent.change(interval, { target: { value: value.input } });

        expect(interval).toHaveValue(value.input);
        expect(interval).toHaveAttribute("aria-valuetext", value.spoken);
        expect(screen.getByText(value.visible, { exact: true })).toBeVisible();
        expect(interval).toHaveAccessibleDescription(copy.description);
        expect(screen.getByRole("checkbox", { name: copy.autoplayLabel })).toHaveProperty("checked", defaultAutoPlay);
        expect(screen.getByRole("checkbox", { name: copy.playbackLabel })).toHaveProperty("checked", showPlaybackControls);
      }
    }
  );
});
