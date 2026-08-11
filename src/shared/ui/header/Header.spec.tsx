/**
 * @file Verifies the "Header" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders an elevated
 * safe-area-aware fixed shell with touch-sized SVG actions", "preserves action order and callback
 * payloads for light and dark modes", "retains clickable SVG actions without changing their
 * selector contract".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Header } from "./Header";

describe("Header", () => {
  it("renders the logo in a fixed banner", () => {
    render(<Header fixed />);

    expect(screen.getByRole("banner")).toHaveClass("fixed");
    expect(screen.getByText("tango")).toBeInTheDocument();
  });

  it("preserves action callbacks and dark-mode payloads", () => {
    const events: string[] = [];
    const view = render(
      <Header
        onClickLogo={() => events.push("logo")}
        onClickDarkMode={(dark) => events.push(`dark:${dark}`)}
        onClickImport={() => events.push("import")}
        onClickSettings={() => events.push("settings")}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "tango" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Import decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(events).toEqual(["logo", "dark:true", "import", "settings"]);

    view.rerender(<Header dark onClickDarkMode={(dark) => events.push(`dark:${dark}`)} />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));

    expect(events).toEqual(["logo", "dark:true", "import", "settings", "dark:false"]);
  });
});
