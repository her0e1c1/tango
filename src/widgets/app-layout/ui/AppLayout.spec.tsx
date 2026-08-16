import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  darkMode: false,
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => ({ appearance: { darkMode: mocks.darkMode } }),
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));

import { AppLayout } from "./AppLayout";

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.darkMode = false;
  });

  it("owns application header navigation and theme actions", () => {
    const view = render(<AppLayout showHeader>Page content</AppLayout>);

    expect(screen.getByText("Page content")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "tango" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Import decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/", undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/import", undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, "/settings", undefined);
    expect(mocks.setDarkMode).toHaveBeenCalledExactlyOnceWith(true);

    mocks.darkMode = true;
    view.rerender(<AppLayout showHeader>Page content</AppLayout>);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(mocks.setDarkMode).toHaveBeenNthCalledWith(2, false);
  });
});
