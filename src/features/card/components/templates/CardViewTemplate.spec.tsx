/**
 * @file Verifies the "CardViewTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves optional back
 * content in a reading-width surface", "renders without back content".
 */

import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { CardViewTemplate } from "@/features/card/components/templates/CardViewTemplate";

describe("CardViewTemplate", () => {
  afterEach(cleanup);
  it("preserves optional back content in a reading-width surface", () => {
    const view = render(<CardViewTemplate backText={{ text: "Card answer" }} />);
    expect(view.getByText("Card answer").closest("section")).toHaveClass("max-w-reading");
  });
  it("renders without back content", () => {
    const view = render(<CardViewTemplate />);
    expect(view.queryByText("Card answer")).not.toBeInTheDocument();
  });
});
