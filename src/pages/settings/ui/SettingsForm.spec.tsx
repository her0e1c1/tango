import type React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { getI18n } from "react-i18next";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { studyPreferencesLimits, type Preferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { getSettingsFormValues, type SettingsFormValues } from "../model/queries/getSettingsFormValues";
import { SettingsForm } from "./SettingsForm";

const commitHash = "0123456789abcdef0123456789abcdef01234567";
const defaultValues = createPreferences({
  showPlaybackControls: true,
  useCardInterval: true,
  maxNumberOfCardsToLearn: 24,
  cardInterval: 7,
});

const SettingsFormHarness: React.FC<{ values?: Preferences }> = ({ values = defaultValues }) => {
  const form = useForm<SettingsFormValues>({ defaultValues: getSettingsFormValues(values) });
  return (
    <SettingsForm form={form} studyPreferencesLimits={studyPreferencesLimits} version="1.2.3" commitHash={commitHash} />
  );
};

describe("SETTINGS-01 SETTINGS-02 SETTINGS-04 SettingsForm", () => {
  it("groups every auto-saved setting in the unified settings list", () => {
    render(<SettingsFormHarness />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    expect(screen.getByText("Changes are saved automatically")).toBeVisible();
    for (const name of ["Language", "Appearance", "Study"]) {
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("region", { name: "Account" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Advanced" })).toBeInTheDocument();
  });

  it("renders and updates switches and numeric sliders through RHF registration", async () => {
    render(<SettingsFormHarness />);
    const playback = screen.getByRole("checkbox", { name: "Show playback controls" });
    const backTextSwipeOverlays = screen.getByRole("checkbox", { name: "Show back text swipe overlays" });
    const cardDetails = screen.getByRole("checkbox", { name: "Show card details" });
    const skip = screen.getByRole("checkbox", { name: "Show skip control" });
    const language = screen.getByRole("combobox", { name: "Language" });
    const maximumCards = screen.getByRole("slider", { name: "Maximum cards" });
    expect(playback).toBeChecked();
    expect(backTextSwipeOverlays).not.toBeChecked();
    expect(cardDetails).toBeChecked();
    expect(skip).toBeChecked();
    expect(language).toHaveValue("system");
    expect(language).toHaveDisplayValue("System");
    expect(screen.getByText("Display left and right study actions while viewing an answer")).toBeInTheDocument();
    expect(maximumCards).toHaveValue("24");

    await userEvent.selectOptions(language, "ja");
    await userEvent.click(playback);
    await userEvent.click(backTextSwipeOverlays);
    await userEvent.click(cardDetails);
    await userEvent.click(skip);
    fireEvent.change(maximumCards, { target: { value: "31" } });

    expect(playback).not.toBeChecked();
    expect(backTextSwipeOverlays).toBeChecked();
    expect(cardDetails).not.toBeChecked();
    expect(skip).not.toBeChecked();
    expect(language).toHaveValue("ja");
    expect(language).toHaveDisplayValue("日本語");
    expect(maximumCards).toHaveValue("31");
    expect(maximumCards).toHaveAttribute("aria-valuetext", "31 cards");
    expect(screen.getByText("31")).toBeInTheDocument();
  });

  it("preserves scheduling descriptions and metadata", () => {
    render(<SettingsFormHarness />);
    expect(screen.getByRole("checkbox", { name: "Respect review schedule" })).toBeChecked();
    expect(screen.getByText("Hide cards until their next review time")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Autoplay interval" })).toHaveAttribute("aria-valuetext", "7 seconds");
    const details = screen.getByRole("group", { name: "Advanced" });
    expect(details).toHaveTextContent("1.2.3");
    expect(details).toHaveTextContent("0123456");
    expect(details).not.toHaveTextContent("01234567");
    expect(screen.getByRole("link", { name: "0123456" })).toHaveAttribute(
      "href",
      `https://github.com/her0e1c1/tango/commit/${commitHash}`
    );
    expect(details).not.toHaveTextContent("Main branch");
  });

  it("keeps section heading relationships unique across multiple instances", () => {
    render(
      <>
        <SettingsFormHarness />
        <SettingsFormHarness />
      </>
    );
    for (const name of ["Language", "Appearance", "Study"]) {
      expect(screen.getAllByRole("region", { name })).toHaveLength(2);
      expect(screen.getAllByRole("heading", { level: 2, name })).toHaveLength(2);
    }
  });

  it("renders Japanese presentation and accessible value text from the active locale", async () => {
    await getI18n().changeLanguage("ja");

    render(<SettingsFormHarness />);

    expect(screen.getByRole("heading", { level: 1, name: "設定" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "言語" })).toHaveDisplayValue("System");
    expect(screen.getByRole("checkbox", { name: "裏面のスワイプ操作を表示" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "ダークモード" })).toBeVisible();
    expect(screen.getByRole("slider", { name: "最大カード数" })).toHaveAttribute("aria-valuetext", "24枚");
    expect(screen.getByRole("slider", { name: "自動再生の間隔" })).toHaveAttribute("aria-valuetext", "7秒");
  });
});

describe("SETTINGS-02 maximum card count presentation", () => {
  it.each([
    {
      locale: "en",
      label: "Maximum cards",
      allMatching: "All matching cards",
      single: "1 card",
      plural: "2 cards",
      help: "tags and any active review schedule",
    },
    {
      locale: "ja",
      label: "最大カード数",
      allMatching: "条件に一致するすべてのカード",
      single: "1枚",
      plural: "2枚",
      help: "難易度・タグ・有効な復習スケジュール",
    },
  ])(
    "explains zero and preserves positive counts in $locale",
    async ({ locale, label, allMatching, single, plural, help }) => {
      await getI18n().changeLanguage(locale);
      render(<SettingsFormHarness values={createPreferences({ maxNumberOfCardsToLearn: 0 })} />);

      const slider = screen.getByRole("slider", { name: label });
      expect(slider).toHaveValue("0");
      expect(slider).toHaveAttribute("min", "0");
      expect(slider).toHaveAttribute("max", "100");
      expect(slider).toHaveAttribute("aria-valuetext", allMatching);
      expect(slider).toHaveAccessibleDescription(expect.stringContaining(help));
      expect(screen.getByText(allMatching)).toBeVisible();

      fireEvent.change(slider, { target: { value: "1" } });
      expect(slider).toHaveAttribute("aria-valuetext", single);
      expect(screen.getByText("1")).toBeVisible();
      expect(screen.queryByText(allMatching)).not.toBeInTheDocument();

      fireEvent.change(slider, { target: { value: "2" } });
      expect(slider).toHaveAttribute("aria-valuetext", plural);
      expect(screen.getByText("2")).toBeVisible();

      fireEvent.change(slider, { target: { value: "0" } });
      expect(slider).toHaveAttribute("aria-valuetext", allMatching);
      expect(screen.getByText(allMatching)).toBeVisible();
    }
  );
});
