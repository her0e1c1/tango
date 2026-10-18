import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { updatePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { I18nProvider } from ".";
import { appI18n } from "./instance";
import { resolveEffectiveLanguage } from "./locale";

describe("resolveEffectiveLanguage", () => {
  it.each([
    ["en", "ja-JP", "en"],
    ["ja", "en-US", "ja"],
    ["system", "ja", "ja"],
    ["system", "ja-JP", "ja"],
    ["system", "en-GB", "en"],
    ["system", "fr-FR", "en"],
    ["system", undefined, "en"],
  ] as const)("resolves %s with browser locale %s to %s", (preference, browserLanguage, expected) => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `resolveEffectiveLanguage` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(resolveEffectiveLanguage(preference, browserLanguage)).toBe(expected);
  });
});

const StatefulCopy = () => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");

  return (
    <>
      <p>{t("settings.title")}</p>
      <label>
        Draft
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
    </>
  );
};

describe("I18nProvider", () => {
  let browserLanguage = "en-US";

  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    browserLanguage = "en-US";
    vi.spyOn(window.navigator, "language", "get").mockImplementation(() => browserLanguage);
    updatePreferences(createPreferences({ language: "en" }));
    void appI18n.changeLanguage("en");
    document.documentElement.lang = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts from deterministic English and synchronizes an explicit language with html[lang]", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `appI18n.t` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(appI18n.t("settings.title")).toBe("Settings");

    // When: Exercise `updatePreferences` with the prepared inputs.
    updatePreferences({ language: "ja" });
    render(
      <I18nProvider>
        <StatefulCopy />
      </I18nProvider>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "ja");
  });

  it("follows browser language changes while System is selected without remounting children", () => {
    // Given: Use this case's inputs and any shared test setup.
    updatePreferences({ language: "system" });
    render(
      <I18nProvider>
        <StatefulCopy />
      </I18nProvider>
    );
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(screen.getByRole("textbox", { name: "Draft" }), { target: { value: "preserved" } });

    browserLanguage = "ja-JP";
    act(() => window.dispatchEvent(new Event("languagechange")));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("設定")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("preserved");
    expect(document.documentElement).toHaveAttribute("lang", "ja");
  });

  it("ignores browser language changes while an explicit language is selected", () => {
    // Given: Use this case's inputs and any shared test setup.
    render(
      <I18nProvider>
        <StatefulCopy />
      </I18nProvider>
    );

    browserLanguage = "ja-JP";
    // When: Exercise `act` with the prepared inputs.
    act(() => window.dispatchEvent(new Event("languagechange")));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("removes the browser listener when the provider unmounts", () => {
    // Given: Use this case's inputs and any shared test setup.
    updatePreferences({ language: "system" });
    const { unmount } = render(
      <I18nProvider>
        <StatefulCopy />
      </I18nProvider>
    );
    unmount();
    void appI18n.changeLanguage("en");
    document.documentElement.lang = "en";

    browserLanguage = "ja-JP";
    // When: Exercise `act` with the prepared inputs.
    act(() => window.dispatchEvent(new Event("languagechange")));

    // Then: Verify the expected result in the assertions below.
    expect(appI18n.resolvedLanguage).toBe("en");
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });
});
