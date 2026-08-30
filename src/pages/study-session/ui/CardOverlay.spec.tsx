/**
 * @file Verifies the "CardOverlay" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves score and seen
 * metadata".
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { CardOverlay } from "./CardOverlay";

describe("CardOverlay", () => {
  it("preserves score and seen metadata", () => {
    render(<CardOverlay score={-2} numberOfSeen={4} lastSeenAt={Date.UTC(2024, 0, 2)} />);
    expect(screen.getByLabelText("Score -2, negative")).toBeInTheDocument();
    expect(screen.getByText(/4 times/)).toBeInTheDocument();
    expect(screen.getByText(/4 times/)).toBeVisible();
  });
});
