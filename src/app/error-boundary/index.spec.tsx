import { actAsync } from "@/test/act";
import { appI18n } from "../i18n/instance";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import React, { useEffect } from "react";

import { clearLocalDataAndReload } from "./clear-local-data";
vi.mock("./clear-local-data", () => ({ clearLocalDataAndReload: vi.fn(), isLocalDataResetRequested: () => false }));

import { AppErrorBoundary, AppErrorFallback } from "./index";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { RouteErrorFallback } from "../routes/RouteErrorFallback";

const ApplicationContent = ({ crash = false }: { crash?: boolean }) => {
  if (crash) throw new Error("render failed");
  return <p>Application content</p>;
};

describe("NAVIGATION-03 AppErrorBoundary", () => {
  it("renders its children while the application is healthy", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <AppErrorBoundary>
        <ApplicationContent />
      </AppErrorBoundary>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Application content")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("replaces crashed content with reload feedback", () => {
    // Given: Prepare `onCaughtError` and any shared test state below.
    const onCaughtError = vi.fn();

    // When: Exercise `render` with the prepared inputs.
    const view = render(
      <AppErrorBoundary>
        <ApplicationContent />
      </AppErrorBoundary>,
      { onCaughtError }
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Application content")).toBeVisible();

    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(
      <AppErrorBoundary>
        <ApplicationContent crash />
      </AppErrorBoundary>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Clear local data and reload" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText(/render failed/)).toBeVisible();
    expect(screen.queryByText("Application content")).not.toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  });
});

it("NAVIGATION-03 uses the initialized locale outside I18nProvider", async () => {
  // Given: Use this case's inputs and any shared test setup.
  await appI18n.changeLanguage("ja");
  // When: Exercise `render` with the prepared inputs.
  render(
    <AppErrorBoundary>
      <ApplicationContent crash />
    </AppErrorBoundary>,
    { onCaughtError: vi.fn() }
  );
  // Then: Verify the expected result in the assertions below.
  expect(screen.getByRole("heading", { name: "問題が発生しました" })).toBeVisible();
  expect(screen.getByRole("button", { name: "再読み込み" })).toBeVisible();
  expect(document.documentElement).toHaveAttribute("lang", "ja");
  expect(screen.getByText(/匿名データは復元できません/)).toBeVisible();
  // When: Exercise `actAsync` with the prepared inputs.
  await actAsync(() => appI18n.changeLanguage("en"));
  // Then: Verify the expected result in the assertions below.
  expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  expect(document.documentElement).toHaveAttribute("lang", "en");
});

afterEach(() => vi.restoreAllMocks());

describe("NAVIGATION-04 unhandled browser errors", () => {
  it.each([new Error("async failure"), "failure", null, undefined, false, 0, ""])(
    "shows recovery regardless of rejection reason: %s",
    (reason) => {
      // Given: Prepare `event`, `message`, `reset` and any shared test state below.
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
      const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "";
      expect(screen.getByRole("alert")).toHaveTextContent(`Anonymous data cannot be recovered. ${message}`.trim());
      expect(event.defaultPrevented).toBe(false);
      expect(screen.getAllByRole("button")).toHaveLength(1);
      expect(screen.queryByText("Application content")).not.toBeInTheDocument();
      const reset = screen.getByRole("button", { name: "Reload" });
      // When: Exercise `reset.focus` with the prepared inputs.
      reset.focus();
      fireEvent(window, new ErrorEvent("error", { error: new Error("duplicate") }));
      // Then: Verify the expected result in the assertions below.
      expect(reset).toHaveFocus();
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expect(screen.getByRole("alert")).not.toHaveTextContent("duplicate");
    }
  );

  it("ignores resource errors and removes both listeners across StrictMode and unmount", () => {
    // Given: Prepare `add`, `remove`, `view` and any shared test state below.
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const view = render(
      <React.StrictMode>
        <AppErrorBoundary>
          <ApplicationContent />
        </AppErrorBoundary>
      </React.StrictMode>
    );
    // When: Exercise `fireEvent` with the prepared inputs.
    fireEvent(window, new Event("error"));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Application content")).toBeVisible();
    // When: Exercise `fireEvent` with the prepared inputs.
    fireEvent(window, new ErrorEvent("error", { message: "timer failure" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByText(/timer failure/)).toBeVisible();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    for (const type of ["error", "unhandledrejection"]) {
      // Given: Prepare `registrations`, `removals` and any shared test state below.
      const registrations = add.mock.calls.filter(([name]) => name === type);
      const removals = remove.mock.calls.filter(([name]) => name === type);
      // Then: Verify the expected result in the assertions below.
      expect(registrations).toHaveLength(2);
      expect(removals).toEqual(registrations);
    }
    // When: Exercise `fireEvent` with the prepared inputs.
    fireEvent(window, new ErrorEvent("error"));
    render(
      <AppErrorBoundary>
        <ApplicationContent />
      </AppErrorBoundary>
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Application content")).toBeVisible();
    // When: Exercise `fireEvent` with the prepared inputs.
    fireEvent(window, new Event("unhandledrejection"));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toBeVisible();
  });
});

describe("NAVIGATION-03 provider lifecycle and initial render failures", () => {
  it("catches provider effects", () => {
    // Given: Use this case's inputs and any shared test setup.
    function FailedProvider() {
      useEffect(() => {
        throw new Error("provider failed");
      }, []);
      return <ApplicationContent />;
    }
    // When: Exercise `render` with the prepared inputs.
    render(
      <AppErrorBoundary>
        <FailedProvider />
      </AppErrorBoundary>,
      { onCaughtError: vi.fn() }
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toBeVisible();
  });
});

it("NAVIGATION-03 displays the original route failure with recovery actions", () => {
  // Given: Prepare `router` and any shared test state below.
  const router = createMemoryRouter([
    {
      path: "/",
      element: <ApplicationContent crash />,
      errorElement: <RouteErrorFallback />,
    },
  ]);
  // When: Exercise `render` with the prepared inputs.
  render(<RouterProvider router={router} />);
  // Then: Verify the expected result in the assertions below.
  expect(screen.getByText(/render failed/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  expect(screen.getAllByRole("button")).toHaveLength(1);
});

it("NAVIGATION-22 prevents overlapping recovery actions and offers retry after deletion fails", async () => {
  // Given: Prepare `deletion` and any shared test state below.
  const deletion = Promise.withResolvers<void>();
  vi.mocked(clearLocalDataAndReload).mockReturnValueOnce(deletion.promise);
  render(<AppErrorFallback allowLocalDataReset />);
  // When: Exercise `fireEvent.click` with the prepared inputs.
  fireEvent.click(screen.getByRole("button", { name: "Clear local data and reload" }));
  // Then: Verify the expected result in the assertions below.
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(screen.getByText(/Clearing local data/)).toBeVisible();
  // When: Exercise `actAsync` with the prepared inputs.
  await actAsync(async () => {
    deletion.reject(new Error("failed-precondition"));
    await deletion.promise.catch(() => undefined);
  });
  // Then: Verify the expected result in the assertions below.
  expect(screen.getByText(/Close other Tango tabs or windows and try again/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Clear local data and reload" })).toBeVisible();
});
