import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Difficulty } from "./Difficulty";

describe("Difficulty [CARD-01]", () => {
  it.each([
    [1, "easy"],
    [5, "neutral"],
    [10, "hard"],
    [5.5, "hard"],
  ] as const)("shows difficulty %s with a semantic %s cue", (difficulty, cue) => {
    render(<Difficulty difficulty={difficulty} />);

    const status = screen.getByLabelText(`Difficulty ${String(difficulty)}, ${cue}`);
    expect(status).toHaveTextContent(String(difficulty));
  });

  it("uses the neutral prior when no value is provided", () => {
    render(<Difficulty />);

    expect(screen.getByLabelText("Difficulty 5, neutral")).toBeInTheDocument();
  });
});
