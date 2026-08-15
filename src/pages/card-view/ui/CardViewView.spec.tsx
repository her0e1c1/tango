/**
 * @file Verifies the "CardViewView" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves optional back
 * content in a reading-width surface", "renders without back content".
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/firebase", () => ({ auth: {} }));

import { CardViewView } from "./CardViewView";

describe("CardViewView", () => {
  it("preserves optional back content in a reading-width surface", () => {
    render(<CardViewView backText={{ text: "Card answer" }} />);
    expect(screen.getByText("Card answer")).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });
  it("renders without back content", () => {
    render(<CardViewView />);
    expect(screen.queryByText("Card answer")).not.toBeInTheDocument();
  });
});
