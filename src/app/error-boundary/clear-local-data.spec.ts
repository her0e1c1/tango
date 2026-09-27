import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ terminate: vi.fn(), clear: vi.fn(), reload: vi.fn(), db: {} }));
vi.mock("firebase/firestore", () => ({ terminate: mocks.terminate, clearIndexedDbPersistence: mocks.clear }));
vi.mock("@/shared/firebase", () => ({ db: mocks.db }));

beforeEach(() => {
  vi.resetModules();
  mocks.terminate.mockReset().mockResolvedValue(undefined);
  mocks.clear.mockReset().mockResolvedValue(undefined);
  mocks.reload.mockReset();
  vi.stubGlobal("window", { location: { reload: mocks.reload } });
});
afterEach(() => vi.unstubAllGlobals());

describe("NAVIGATION-22 Local database recovery", () => {
  it("waits for termination and persistence deletion before reloading", async () => {
    const stopped = Promise.withResolvers<void>();
    const cleared = Promise.withResolvers<void>();
    mocks.terminate.mockReturnValue(stopped.promise);
    mocks.clear.mockReturnValue(cleared.promise);
    const { clearLocalDataAndReload } = await import("./clear-local-data");
    const operation = clearLocalDataAndReload();
    expect(clearLocalDataAndReload()).toBe(operation);
    await vi.waitFor(() => expect(mocks.terminate).toHaveBeenCalledWith(mocks.db));
    expect(mocks.clear).not.toHaveBeenCalled();
    stopped.resolve();
    await vi.waitFor(() => expect(mocks.clear).toHaveBeenCalledWith(mocks.db));
    expect(mocks.reload).not.toHaveBeenCalled();
    cleared.resolve();
    await operation;
    expect(mocks.reload).toHaveBeenCalledOnce();
  });

  it("keeps failed deletion on the recovery page and retries the terminated instance", async () => {
    mocks.clear.mockRejectedValueOnce(new Error("failed-precondition"));
    const { clearLocalDataAndReload } = await import("./clear-local-data");
    await expect(clearLocalDataAndReload()).rejects.toThrow("failed-precondition");
    expect(mocks.reload).not.toHaveBeenCalled();
    await clearLocalDataAndReload();
    expect(mocks.terminate).toHaveBeenCalledOnce();
    expect(mocks.reload).toHaveBeenCalledOnce();
  });

  it("does not delete persistence after failed termination and permits another attempt", async () => {
    let stopped: Promise<void> | undefined;
    mocks.terminate.mockImplementation(() => (stopped ??= Promise.reject(new Error("termination failed"))));
    const { clearLocalDataAndReload } = await import("./clear-local-data");
    await expect(clearLocalDataAndReload()).rejects.toThrow("termination failed");
    expect(mocks.clear).not.toHaveBeenCalled();
    expect(mocks.reload).not.toHaveBeenCalled();
    await clearLocalDataAndReload();
    expect(mocks.terminate).toHaveBeenCalledOnce();
    expect(mocks.clear).toHaveBeenCalledWith(mocks.db);
    expect(mocks.reload).toHaveBeenCalledOnce();
  });
});
