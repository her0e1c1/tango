/**
 * @file Verifies the "shared status content" contract with automated examples.
 * The examples verify semantic score cues for assistive technology.
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Score } from "./Score";

describe("shared status content", () => {
  it.each([
    [2, "positive"],
    [-2, "negative"],
    [0, "neutral"],
  ] as const)("gives score %s a semantic %s cue", (score, cue) => {
    render(<Score score={score} />);
    const status = screen.getByLabelText(`Score ${score}, ${cue}`);
    expect(status).toHaveTextContent(`${score}`);
  });

  it.each([
    [100, ">99", "positive"],
    [-100, "<-99", "negative"],
  ] as const)("bounds score %s visually while preserving its accessible value", (score, displayScore, cue) => {
    render(<Score score={score} />);
    const status = screen.getByLabelText(`Score ${score}, ${cue}`);
    expect(status).toHaveTextContent(displayScore);
  });
});
