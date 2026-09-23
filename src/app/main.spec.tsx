import { actAsync } from "@/test/act";
import { act, screen, waitFor } from "@testing-library/react";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const startup = vi.hoisted(() => ({
  reset: vi.fn<() => Promise<boolean>>(),
  load: vi.fn(),
  root: null as Root | null,
}));
vi.mock("./error-boundary/reset", () => ({
  resetApplicationIfRequested: startup.reset,
  requestApplicationReset: vi.fn(),
}));
vi.mock("react-dom/client", async (importOriginal) => {
  const client = await importOriginal<typeof import("react-dom/client")>();
  return {
    ...client,
    createRoot: (...args: Parameters<typeof client.createRoot>) => {
      startup.root = client.createRoot(...args);
      return startup.root;
    },
  };
});

beforeEach(() => {
  vi.resetModules();
  startup.reset.mockReset().mockResolvedValue(false);
  startup.load.mockReset();

  vi.doMock("@/shared/firebase", () => ({}));
  vi.doMock("./routes", () => ({
    appRoutes: [{ path: "*", element: null }],
  }));
  vi.doMock("virtual:pwa-register", () => ({
    registerSW: vi.fn(),
  }));
  vi.doMock("./App", () => {
    startup.load();
    return { default: () => <p>Normal application</p> };
  });

  const container = document.createElement("div");
  container.id = "root";
  document.body.append(container);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  act(() => startup.root?.unmount());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("NAVIGATION-06 lazy application startup", () => {
  it("waits for the reset check before loading the application", async () => {
    const reset = Promise.withResolvers<boolean>();
    startup.reset.mockReturnValue(reset.promise);
    await actAsync(async () => {
      await import("./main");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Preparing Tango…");
    expect(startup.load).not.toHaveBeenCalled();
    await actAsync(async () => {
      reset.resolve(false);
      await reset.promise;
    });
    expect(await screen.findByText("Normal application")).toBeVisible();
    expect(startup.reset).toHaveBeenCalledOnce();
    expect(startup.load).toHaveBeenCalledOnce();
  });

  it("shows shared recovery when the application module fails to initialize", async () => {
    startup.load.mockImplementation(() => {
      throw new Error("application startup failed");
    });
    await actAsync(async () => {
      await import("./main");
    });
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Clear cache and reset" })).toBeVisible();
    expect(screen.queryByText("Normal application")).not.toBeInTheDocument();
  });
});

describe("NAVIGATION-07 reset startup isolation", () => {
  it("finishes without loading the application after a successful reset redirects", async () => {
    startup.reset.mockResolvedValue(true);
    await actAsync(async () => {
      await import("./main");
    });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(startup.reset).toHaveBeenCalledOnce();
    expect(startup.load).not.toHaveBeenCalled();
    expect(screen.queryByText("Normal application")).not.toBeInTheDocument();
  });

  it("shows shared recovery without normal startup when reset rejects", async () => {
    startup.reset.mockRejectedValue(new Error("persistence deletion failed"));
    await actAsync(async () => {
      await import("./main");
    });
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(startup.load).not.toHaveBeenCalled();
    expect(startup.reset).toHaveBeenCalledOnce();
  });
});
