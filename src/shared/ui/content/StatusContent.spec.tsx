/**
 * @file Verifies the "shared status content" contract with automated examples.
 * The examples verify semantic score cues and ensure every feedback tone includes a non-color
 * label for assistive technology.
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Feedback } from "../feedback";
import type { FeedbackTone } from "../feedback/Feedback";
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

  it.each([
    ["neutral", "Information"],
    ["success", "Success"],
    ["warning", "Warning"],
    ["error", "Error"],
  ] as const)("renders %s feedback with a non-color label", (tone, label) => {
    render(<Feedback tone={tone as FeedbackTone}>Saved</Feedback>);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(`${label}: Saved`);
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
