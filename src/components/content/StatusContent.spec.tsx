/**
 * @file Verifies the "shared status content" contract with automated examples.
 * The examples verify semantic score cues and ensure every feedback tone includes a non-color
 * label for assistive technology.
 */

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { Score } from "@/components/content/Score";
import { Feedback, type FeedbackTone } from "@/components/feedback/Feedback";

afterEach(cleanup);

describe("shared status content", () => {
  it.each([
    [2, "positive", "bg-success"],
    [-2, "negative", "bg-danger"],
    [0, "neutral", "bg-info"],
  ] as const)("gives score %s a semantic %s cue", (score, cue, colorClass) => {
    render(<Score score={score} />);
    const status = screen.getByLabelText(`Score ${score}, ${cue}`);
    expect(status).toHaveClass(colorClass, "text-ink-inverse", "rounded-pill");
    expect(status.querySelector("span")?.textContent).toBe(`${score}`);
  });

  it.each([
    ["neutral", "Information", "bg-info"],
    ["success", "Success", "bg-success"],
    ["warning", "Warning", "bg-warning"],
    ["error", "Error", "bg-danger"],
  ] as const)("renders %s feedback with a non-color label", (tone, label, colorClass) => {
    render(<Feedback tone={tone as FeedbackTone}>Saved</Feedback>);
    const status = screen.getByRole("status");
    expect(status).toHaveClass(colorClass);
    expect(status).toHaveTextContent(`${label}: Saved`);
    expect(screen.getByText(`${label}:`, { exact: false })).toHaveClass("sr-only");
  });
});
