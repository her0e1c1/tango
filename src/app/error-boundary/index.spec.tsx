import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { AppErrorBoundary } from "./index";

const ApplicationContent = ({ crash = false }: { crash?: boolean }) => {
  if (crash) throw new Error("render failed");
  return <p>Application content</p>;
};

describe("AppErrorBoundary", () => {
  it("renders its children while the application is healthy", () => {
    render(
      <AppErrorBoundary>
        <ApplicationContent />
      </AppErrorBoundary>
    );

    expect(screen.getByText("Application content")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("replaces crashed content with reload feedback", async () => {
    const reload = vi.fn();
    const onCaughtError = vi.fn();
    const user = userEvent.setup();

    const view = render(
      <AppErrorBoundary reload={reload}>
        <ApplicationContent />
      </AppErrorBoundary>,
      { onCaughtError }
    );
    expect(screen.getByText("Application content")).toBeVisible();

    view.rerender(
      <AppErrorBoundary reload={reload}>
        <ApplicationContent crash />
      </AppErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    expect(screen.getByText("Tango encountered an unexpected error. Reload the app to try again.")).toBeVisible();
    expect(screen.queryByText("Application content")).not.toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
