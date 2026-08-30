import type React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { studyPreferencesLimits, type Preferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { SettingsForm } from "./SettingsForm";

const commitHash = "0123456789abcdef0123456789abcdef01234567";
const defaultValues = createPreferences({
  showPlaybackControls: true,
  useCardInterval: true,
  maxNumberOfCardsToLearn: 24,
  cardInterval: 7,
});

const SettingsFormHarness: React.FC<{ values?: Preferences }> = ({ values = defaultValues }) => {
  const form = useForm<Preferences>({ defaultValues: values });
  return (
    <SettingsForm form={form} studyPreferencesLimits={studyPreferencesLimits} version="1.2.3" commitHash={commitHash} />
  );
};

describe("SettingsForm", () => {
  it("groups every auto-saved setting in the unified settings list", () => {
    render(<SettingsFormHarness />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    expect(screen.getByText("Changes are saved automatically")).toBeVisible();
    for (const name of ["Appearance", "Study"]) expect(screen.getByRole("region", { name })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Account" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Advanced" })).toBeInTheDocument();
  });

  it("renders and updates switches and numeric sliders through RHF registration", async () => {
    render(<SettingsFormHarness />);
    const playback = screen.getByRole("checkbox", { name: "Show playback controls" });
    const backTextSwipeOverlays = screen.getByRole("checkbox", { name: "Show back text swipe overlays" });
    const cardDetails = screen.getByRole("checkbox", { name: "Show card details" });
    const maximumCards = screen.getByRole("slider", { name: "Maximum cards" });
    expect(playback).toBeChecked();
    expect(backTextSwipeOverlays).not.toBeChecked();
    expect(cardDetails).toBeChecked();
    expect(screen.getByText("Display left and right study actions while viewing an answer")).toBeInTheDocument();
    expect(maximumCards).toHaveValue("24");

    await userEvent.click(playback);
    await userEvent.click(backTextSwipeOverlays);
    await userEvent.click(cardDetails);
    fireEvent.change(maximumCards, { target: { value: "31" } });

    expect(playback).not.toBeChecked();
    expect(backTextSwipeOverlays).toBeChecked();
    expect(cardDetails).not.toBeChecked();
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
    for (const name of ["Appearance", "Study"]) {
      expect(screen.getAllByRole("region", { name })).toHaveLength(2);
      expect(screen.getAllByRole("heading", { level: 2, name })).toHaveLength(2);
    }
  });
});
