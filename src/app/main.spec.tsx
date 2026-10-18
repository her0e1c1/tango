import { actAsync } from "@/test/act";
import { fireEvent, screen } from "@testing-library/react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const startup = vi.hoisted(() => ({
  requested: vi.fn(),
  clear: vi.fn(),
  retry: vi.fn(),
  start: vi.fn(),
  firebaseReady: undefined as Promise<void> | undefined,
  roots: [] as Root[],
}));
vi.mock("./error-boundary/clear-local-data", () => ({
  isLocalDataResetRequested: startup.requested,
  clearLocalDataBeforeStartup: startup.clear,
  clearLocalDataAndReload: startup.retry,
}));
vi.mock("./App", () => ({ default: () => <p>Application ready</p> }));
vi.mock("./routes", () => ({ appRoutes: [{ path: "*", element: null }] }));
vi.mock("react-dom/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-dom/client")>();
  return {
    ...original,
    createRoot: (...args: Parameters<typeof original.createRoot>) => {
      const root = original.createRoot(args[0], { ...args[1], onCaughtError: () => {} });
      startup.roots.push(root);
      return root;
    },
  };
});

beforeEach(() => {
  // Given: Establish the shared setup used by the following cases.
  vi.resetModules();
  startup.firebaseReady = undefined;
  vi.doMock("@/shared/firebase", async () => {
    startup.start();
    await startup.firebaseReady;
    return {};
  });
  vi.clearAllMocks();
  startup.requested.mockReturnValue(true);
  startup.retry.mockResolvedValue(undefined);
  document.body.innerHTML = '<div id="root"></div>';
});
afterEach(async () => {
  await actAsync(async () => {
    for (const root of startup.roots.splice(0)) root.unmount();
  });
  document.body.innerHTML = "";
  document.documentElement.lang = "en";
  vi.restoreAllMocks();
});

describe("NAVIGATION-22 Application startup recovery", () => {
  it("waits for storage deletion before starting the application", async () => {
    // Given: Prepare `finish` and any shared test state below.
    let finish = () => {};
    startup.clear.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await import("./main");
    });
    // Then: Verify the expected result in the assertions below.
    expect(startup.start).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Starting Tango…");
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      finish();
    });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Application ready")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows retry feedback and prevents startup when deletion fails", async () => {
    // Given: Use this case's inputs and any shared test setup.
    startup.clear.mockRejectedValue(new Error("Close other Tango tabs or windows and try again"));
    await actAsync(async () => {
      await import("./main");
    });
    expect(
      screen.getByText(/Unable to clear local data\. Close other Tango tabs or windows and try again\./)
    ).toBeVisible();
    expect(startup.start).not.toHaveBeenCalled();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Clear local data and reload" }));
    });
    // Then: Verify the expected result in the assertions below.
    expect(startup.retry).toHaveBeenCalledOnce();
    expect(startup.start).not.toHaveBeenCalled();
  });

  it("routes a failed startup import to non-destructive boundary feedback", async () => {
    // Given: Prepare `fail`, `pendingImport` and any shared test state below.
    startup.requested.mockReturnValue(false);
    let fail = (_error: Error) => {};
    const pendingImport = new Promise<never>((_resolve, reject) => {
      fail = reject;
    });
    startup.firebaseReady = pendingImport;
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await import("./main");
    });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toHaveTextContent("Starting Tango…");
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      fail(new Error("Startup import failed"));
    });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Clear local data and reload" })).not.toBeInTheDocument();
  });

  it("keeps recovery available when reading the reset request fails", async () => {
    // Given: Use this case's inputs and any shared test setup.
    startup.requested.mockImplementation(() => {
      throw new DOMException("Storage denied", "SecurityError");
    });
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await import("./main");
    });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "delete Tango's site data in your browser's site settings"
    );
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Clear local data and reload" })).not.toBeInTheDocument();
    expect(startup.start).not.toHaveBeenCalled();
    expect(startup.clear).not.toHaveBeenCalled();
  });

  it("announces pending startup in the browser language", async () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.spyOn(navigator, "language", "get").mockReturnValue("ja-JP");
    startup.clear.mockReturnValue(new Promise<void>(() => {}));
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await import("./main");
    });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toHaveTextContent("Tango を起動しています…");
    expect(document.documentElement).toHaveAttribute("lang", "ja");
    expect(startup.start).not.toHaveBeenCalled();
  });

  it("starts without deleting storage when no reset was requested", async () => {
    // Given: Use this case's inputs and any shared test setup.
    startup.requested.mockReturnValue(false);
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await import("./main");
    });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Application ready")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(startup.clear).not.toHaveBeenCalled();
  });
});
