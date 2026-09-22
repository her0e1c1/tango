import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { CardOverlay } from "./CardOverlay";
describe("CardOverlay [CARD-VIEW-01]", () => {
  it("shows FSRS difficulty only after rating", () => {
    const view = render(<CardOverlay fsrs={null} />);
    expect(screen.getByText("not studied yet")).toBeVisible();
    view.rerender(<CardOverlay fsrs={{ difficulty: 8, lastReviewedAt: Date.UTC(2024, 0, 2) }} />);
    expect(screen.getByText(/FSRS D: 8/)).toBeVisible();
  });
});
