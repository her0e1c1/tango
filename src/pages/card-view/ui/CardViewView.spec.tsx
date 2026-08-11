/**
 * @file Verifies the "CardViewView" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves optional back
 * content in a reading-width surface", "renders without back content".
 */

import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { CardViewView } from "./CardViewView";

describe("CardViewView", () => {
  afterEach(cleanup);
  it("preserves optional back content in a reading-width surface", () => {
    const view = render(<CardViewView backText={{ text: "Card answer" }} />);
    expect(view.getByText("Card answer").closest("section")).toHaveClass("max-w-reading");
    expect(view.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });
  it("renders without back content", () => {
    const view = render(<CardViewView />);
    expect(view.queryByText("Card answer")).not.toBeInTheDocument();
  });
});
