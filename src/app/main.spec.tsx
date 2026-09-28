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
  roots: [] as Root[],
}));
vi.mock("./error-boundary/clear-local-data", () => ({
  isLocalDataResetRequested: startup.requested,
  clearLocalDataBeforeStartup: startup.clear,
  clearLocalDataAndReload: startup.retry,
}));
vi.mock("./App", () => ({ default: () => null }));
vi.mock("./routes", () => ({ appRoutes: [{ path: "*", element: null }] }));
vi.mock("react-dom/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-dom/client")>();
  return {
    ...original,
    createRoot: (...args: Parameters<typeof original.createRoot>) => {
      const root = original.createRoot(...args);
      startup.roots.push(root);
      return root;
    },
  };
});

beforeEach(() => {
  vi.resetModules();
  vi.doMock("@/shared/firebase", () => {
    startup.start();
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
});

describe("NAVIGATION-22 Application startup recovery", () => {
  it("waits for storage deletion before starting the application", async () => {
    let finish = () => {};
    startup.clear.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    await import("./main");
    expect(startup.start).not.toHaveBeenCalled();
    finish();
    await vi.waitFor(() => expect(startup.start).toHaveBeenCalledOnce());
  });

  it("shows retry feedback and prevents startup when deletion fails", async () => {
    startup.clear.mockRejectedValue(new Error("Close other Tango tabs or windows and try again"));
    await actAsync(async () => {
      await import("./main");
    });
    expect(
      screen.getByText(/Unable to clear local data\. Close other Tango tabs or windows and try again\./)
    ).toBeVisible();
    expect(startup.start).not.toHaveBeenCalled();
    await actAsync(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Clear local data and reload" }));
    });
    expect(startup.retry).toHaveBeenCalledOnce();
    expect(startup.start).not.toHaveBeenCalled();
  });

  it("starts without deleting storage when no reset was requested", async () => {
    startup.requested.mockReturnValue(false);
    await import("./main");
    await vi.waitFor(() => expect(startup.start).toHaveBeenCalledOnce());
    expect(startup.clear).not.toHaveBeenCalled();
  });
});
