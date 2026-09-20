/**
 * @file Verifies the "CardOverlay" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves difficulty and seen
 * metadata".
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { CardOverlay } from "./CardOverlay";

describe("CardOverlay [CARD-01]", () => {
  it("preserves difficulty and seen metadata", () => {
    render(
      <CardOverlay
        difficultySlot={
          <span role="status" aria-label="Difficulty 8, hard">
            8
          </span>
        }
        numberOfSeen={4}
        lastSeenAt={Date.UTC(2024, 0, 2)}
      />
    );
    expect(screen.getByLabelText("Difficulty 8, hard")).toBeInTheDocument();
    expect(screen.getByText(/4 times/)).toBeInTheDocument();
    expect(screen.getByText(/4 times/)).toBeVisible();
  });
});
