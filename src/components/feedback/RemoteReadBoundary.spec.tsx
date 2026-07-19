import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { RemoteReadBoundary } from "@/components/feedback/RemoteReadBoundary";
import { RouteFeedback } from "@/components/feedback/RouteFeedback";

describe("RemoteReadBoundary", () => {
  it("shows loading instead of children before initial data", () => {
    render(
      <RemoteReadBoundary status="loading" hasData={false} onRetry={vi.fn()}>
        content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("status").textContent).toContain("Loading…");
    expect(screen.queryByText("content")).toBeNull();
  });

  it("shows a terminal error and Retry before initial data", () => {
    const onRetry = vi.fn();
    render(
      <RemoteReadBoundary status="error" hasData={false} onRetry={onRetry}>
        content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("alert").textContent).toContain("Unable to load data.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("blocks data access when another tab owns persistent offline storage", () => {
    render(
      <RemoteReadBoundary status="blocked" hasData onRetry={vi.fn()}>
        cached content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("alert").textContent).toContain("Close other tabs or use a supported browser");
    expect(screen.queryByText("cached content")).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("keeps cached content visible beside a terminal sync error", () => {
    render(
      <RemoteReadBoundary status="error" hasData onRetry={vi.fn()}>
        cached content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("alert").textContent).toContain("Sync interrupted. Showing current data.");
    expect(screen.getByText("cached content")).toBeTruthy();
  });

  it("shows the caller's empty message after a successful empty read", () => {
    render(
      <RemoteReadBoundary status="ready" hasData={false} emptyLabel="No decks yet." onRetry={vi.fn()}>
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
        onRetry={vi.fn()}
      >
        content
      </RemoteReadBoundary>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeInTheDocument();
    expect(screen.queryByText("No data yet.")).toBeNull();
  });
});
