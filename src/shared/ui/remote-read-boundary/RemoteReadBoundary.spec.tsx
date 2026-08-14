/**
 * @file Verifies the "RemoteReadBoundary" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "shows loading instead of
 * children before initial data", "shows a terminal error before initial data", "blocks
 * data access when another tab owns persistent offline storage".
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { RouteFeedback } from "@/shared/ui/route-feedback";

import { RemoteReadBoundary } from "./RemoteReadBoundary";

describe("RemoteReadBoundary", () => {
  it("shows loading instead of children before initial data", () => {
    render(
      <RemoteReadBoundary status="loading" hasData={false}>
        content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("status").textContent).toContain("Loading…");
    expect(screen.queryByText("content")).toBeNull();
  });

  it("shows a terminal error before initial data", () => {
    render(
      <RemoteReadBoundary status="error" hasData={false}>
        content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("alert").textContent).toContain("Unable to load data.");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("blocks data access when another tab owns persistent offline storage", () => {
    render(
      <RemoteReadBoundary status="blocked" hasData>
        cached content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("alert").textContent).toContain("Close other tabs or use a supported browser");
    expect(screen.queryByText("cached content")).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("keeps cached content visible beside a terminal sync error", () => {
    render(
      <RemoteReadBoundary status="error" hasData>
        cached content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("alert").textContent).toContain("Sync interrupted. Showing current data.");
    expect(screen.getByText("cached content")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("shows the caller's empty message after a successful empty read", () => {
    render(
      <RemoteReadBoundary status="ready" hasData={false} emptyLabel="No decks yet.">
        content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("status").textContent).toContain("No decks yet.");
  });

  it("shows custom empty content after a successful empty read", () => {
    render(
      <RemoteReadBoundary
        status="ready"
        hasData={false}
        emptyContent={<RouteFeedback title="Deck not found" tone="not-found" />}
      >
        content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeInTheDocument();
    expect(screen.queryByText("No data yet.")).toBeNull();
  });
});
