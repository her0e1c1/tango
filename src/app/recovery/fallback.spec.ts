import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { showStartupFailure } from "./fallback";
import { requestApplicationReset } from "./reset";

vi.mock("./reset", () => ({ requestApplicationReset: vi.fn() }));

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  document.documentElement.lang = "en";
});

describe("NAVIGATION-03 recovery before React initialization", () => {
  it.each([
    ["en", "Unable to start Tango", "Reload", "Clear cache and reset"],
    ["ja", "Tangoを起動できません", "再読み込み", "キャッシュを削除して初期化"],
  ])("offers reload and explicit reset in %s without application providers", (language, title, reloadLabel, resetLabel) => {
    const reload = vi.fn();
    vi.stubGlobal("navigator", { language });
    vi.stubGlobal("window", { location: { reload } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    showStartupFailure(new Error("application module failed"));

    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("heading", { name: title })).toHaveFocus();
    expect(document.documentElement).toHaveAttribute("lang", language);
    fireEvent.click(screen.getByRole("button", { name: reloadLabel }));
    expect(reload).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: resetLabel }));
    expect(requestApplicationReset).toHaveBeenCalledWith(language);
  });
});
