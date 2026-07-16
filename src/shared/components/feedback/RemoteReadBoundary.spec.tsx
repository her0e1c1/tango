import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RemoteReadBoundary } from "@/shared/components/feedback/RemoteReadBoundary";

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
});
