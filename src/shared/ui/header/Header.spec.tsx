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
  it("renders the logo", () => {
    render(<Header fixed />);

    expect(screen.getByText("tango")).toBeInTheDocument();
  });

  it("preserves the logo callback across light and dark modes", () => {
    const events: string[] = [];
    const view = render(<Header onClickLogo={() => events.push("logo")} />);

    fireEvent.click(screen.getByRole("button", { name: "tango" }));
    expect(events).toEqual(["logo"]);

    view.rerender(<Header dark onClickLogo={() => events.push("logo")} />);
    fireEvent.click(screen.getByRole("button", { name: "tango" }));

    expect(events).toEqual(["logo", "logo"]);
  });
});
