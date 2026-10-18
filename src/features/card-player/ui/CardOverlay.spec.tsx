import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { CardOverlay } from "./CardOverlay";
describe("CardOverlay [CARD-VIEW-01]", () => {
  it("shows FSRS difficulty only after rating", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    const view = render(<CardOverlay fsrs={null} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("not studied yet")).toBeVisible();
    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(<CardOverlay fsrs={{ difficulty: 8, lastReviewedAt: Date.UTC(2024, 0, 2) }} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText(/FSRS D: 8/)).toBeVisible();
  });
});
