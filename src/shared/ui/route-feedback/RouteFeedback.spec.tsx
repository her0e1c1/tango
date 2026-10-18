/**
 * @file Verifies the "RouteFeedback" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders loading feedback
 * with a heading and description", "renders error feedback as an alert and invokes its primary
 * action", "renders secondary action before primary action for not-found feedback".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RouteFeedback } from "./RouteFeedback";

describe("RouteFeedback", () => {
  it("renders loading feedback with a heading and description", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <RouteFeedback title="Starting Tango…" description="Preparing your decks and study progress." tone="loading" />
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.getByText("Preparing your decks and study progress.")).toBeInTheDocument();
  });

  it("renders error feedback as an alert and invokes its primary action", () => {
    // Given: Prepare `onReload` and any shared test state below.
    const onReload = vi.fn();
    render(
      <RouteFeedback
        title="Unable to start Tango"
        tone="error"
        primaryAction={{ label: "Reload", onClick: onReload }}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    // Then: Verify the expected result in the assertions below.
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("renders secondary action before primary action for not-found feedback", () => {
    // Given: Prepare `onGoBack`, `onGoHome` and any shared test state below.
    const onGoBack = vi.fn();
    const onGoHome = vi.fn();
    render(
      <RouteFeedback
        title="Page not found"
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: onGoHome }}
        secondaryAction={{ label: "Go back", onClick: onGoBack }}
      />
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Go back", "Go home"]);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    // Then: Verify the expected result in the assertions below.
    expect(onGoBack).toHaveBeenCalledOnce();
    expect(onGoHome).toHaveBeenCalledOnce();
  });
});
