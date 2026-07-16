import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { CardOverlay } from "@/features/card/components/CardOverlay";
import { createCard } from "@/test/factories";

describe("CardOverlay", () => {
  afterEach(cleanup);
  it("preserves score and seen metadata", () => {
    const view = render(
      <CardOverlay card={createCard({ score: -2, numberOfSeen: 4, lastSeenAt: Date.UTC(2024, 0, 2) })} />
    );
    expect(view.getByLabelText("Score -2, negative")).toBeInTheDocument();
    expect(view.getByText(/4 times/)).toBeInTheDocument();
    expect(view.getByText(/4 times/).parentElement).toHaveClass("max-w-reading", "bg-surface-elevated");
  });
});
