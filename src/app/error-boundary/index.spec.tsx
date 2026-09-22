import { actAsync } from "@/test/act";
import { appI18n } from "../i18n/instance";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import React, { useEffect } from "react";

import { AppErrorBoundary } from "./index";

const ApplicationContent = ({ crash = false }: { crash?: boolean }) => {
  if (crash) throw new Error("render failed");
  return <p>Application content</p>;
};

describe("NAVIGATION-03 AppErrorBoundary", () => {
  it("renders its children while the application is healthy", () => {
    render(
      <AppErrorBoundary>
        <ApplicationContent />
      </AppErrorBoundary>
    );

    expect(screen.getByText("Application content")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("replaces crashed content with reload feedback", () => {
    const onCaughtError = vi.fn();

    const view = render(
      <AppErrorBoundary>
        <ApplicationContent />
      </AppErrorBoundary>,
      { onCaughtError }
    );
    expect(screen.getByText("Application content")).toBeVisible();

    view.rerender(
      <AppErrorBoundary>
        <ApplicationContent crash />
      </AppErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    expect(screen.getByText(/Reload to try again, or clear the cache/)).toBeVisible();
    expect(screen.queryByText("Application content")).not.toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  });
});

it("NAVIGATION-03 uses the initialized locale outside I18nProvider", async () => {
  await appI18n.changeLanguage("ja");
  render(
    <AppErrorBoundary>
      <ApplicationContent crash />
    </AppErrorBoundary>,
    { onCaughtError: vi.fn() }
  );
  expect(screen.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
  expect(screen.getByRole("button", { name: "再読み込み" })).toBeVisible();
  expect(document.documentElement).toHaveAttribute("lang", "ja");
  await actAsync(() => appI18n.changeLanguage("en"));
  expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  expect(document.documentElement).toHaveAttribute("lang", "en");
});

afterEach(() => vi.restoreAllMocks());

describe("NAVIGATION-05 unhandled browser errors", () => {
  it.each([new Error("async failure"), "failure", null, undefined, false, 0, ""])(
    "shows recovery regardless of rejection reason: %s",
    (reason) => {
      render(
        <React.StrictMode>
          <AppErrorBoundary>
            <ApplicationContent />
          </AppErrorBoundary>
        </React.StrictMode>
      );
      const event = new Event("unhandledrejection", { cancelable: true });
      Object.defineProperty(event, "reason", { value: reason });
      fireEvent(window, event);
      expect(screen.getByRole("alert")).toBeVisible();
      expect(event.defaultPrevented).toBe(false);
      expect(screen.queryByText("Application content")).not.toBeInTheDocument();
      const reset = screen.getByRole("button", { name: "Clear cache and reset" });
      reset.focus();
      fireEvent(window, new ErrorEvent("error", { error: new Error("duplicate") }));
      expect(reset).toHaveFocus();
      expect(screen.getAllByRole("alert")).toHaveLength(1);
    }
  );

  it("ignores resource errors and removes both listeners across StrictMode and unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const view = render(
      <React.StrictMode>
        <AppErrorBoundary>
          <ApplicationContent />
        </AppErrorBoundary>
      </React.StrictMode>
    );
    fireEvent(window, new Event("error"));
    expect(screen.getByText("Application content")).toBeVisible();
    fireEvent(window, new ErrorEvent("error", { message: "timer failure" }));
    expect(screen.getByRole("alert")).toBeVisible();
    view.unmount();
    for (const type of ["error", "unhandledrejection"]) {
      const registrations = add.mock.calls.filter(([name]) => name === type);
      const removals = remove.mock.calls.filter(([name]) => name === type);
      expect(registrations).toHaveLength(2);
      expect(removals).toEqual(registrations);
    }
    fireEvent(window, new ErrorEvent("error"));
    render(
      <AppErrorBoundary>
        <ApplicationContent />
      </AppErrorBoundary>
    );
    expect(screen.getByText("Application content")).toBeVisible();
    fireEvent(window, new Event("unhandledrejection"));
    expect(screen.getByRole("alert")).toBeVisible();
  });
});

describe("NAVIGATION-03 provider lifecycle and initial render failures", () => {
  it("catches provider effects", () => {
    function FailedProvider() {
      useEffect(() => {
        throw new Error("provider failed");
      }, []);
      return <ApplicationContent />;
    }
    render(
      <AppErrorBoundary>
        <FailedProvider />
      </AppErrorBoundary>,
      { onCaughtError: vi.fn() }
    );
    expect(screen.getByRole("alert")).toBeVisible();
  });

  it("requires confirmation before requesting a reset", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    sessionStorage.clear();
    render(
      <AppErrorBoundary>
        <ApplicationContent crash />
      </AppErrorBoundary>,
      { onCaughtError: vi.fn() }
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear cache and reset" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("unsynced changes"));
    expect(sessionStorage.getItem("tango-startup-reset")).toBeNull();
  });
});
