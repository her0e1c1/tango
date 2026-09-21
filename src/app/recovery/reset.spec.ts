import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requestApplicationReset, resetApplicationIfRequested } from "./reset";

const sdk = vi.hoisted(() => ({
  auth: { currentUser: { uid: "previous-user" } as { uid: string } | null },
  db: {},
  clearPersistence: vi.fn<() => Promise<void>>(),
  signOut: vi.fn<() => Promise<void>>(),
}));
vi.mock("@/shared/firebase", () => ({ auth: sdk.auth, db: sdk.db }));
vi.mock("firebase/firestore", () => ({ clearIndexedDbPersistence: sdk.clearPersistence }));
vi.mock("firebase/auth", () => ({ signOut: sdk.signOut }));

const replace = vi.fn();
const confirm = vi.fn();
const alert = vi.fn();
const ownedCache = "workbox-precache-v2-https://tango.test/";
const otherScopeCache = "workbox-precache-v2-https://tango.test/other/";
let cacheNames: Set<string>;
let registeredScopes: Set<string>;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("tango-config", "saved settings");
  localStorage.setItem("another-app", "keep");
  sdk.auth.currentUser = { uid: "previous-user" };
  sdk.clearPersistence.mockReset().mockResolvedValue(undefined);
  sdk.signOut.mockReset().mockImplementation(async () => {
    sdk.auth.currentUser = null;
  });
  confirm.mockReturnValue(true);
  cacheNames = new Set([ownedCache, otherScopeCache, "another-app"]);
  registeredScopes = new Set(["https://tango.test/", "https://tango.test/other/"]);
  const cacheStorage = {
    keys: async () => [...cacheNames],
    delete: async (name: string) => cacheNames.delete(name),
  };
  vi.stubGlobal("caches", cacheStorage);
  vi.stubGlobal("window", {
    confirm,
    alert,
    caches: cacheStorage,
    location: { origin: "https://tango.test", replace },
  });
  vi.stubGlobal("navigator", {
    language: "en",
    serviceWorker: {
      getRegistrations: async () =>
        [...registeredScopes].map((scope) => ({
          scope,
          unregister: async () => registeredScopes.delete(scope),
        })),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("NAVIGATION-03 explicit application reset", () => {
  it("does not clear data on an ordinary startup or after cancelling the warning", async () => {
    expect(await resetApplicationIfRequested()).toBe(false);
    confirm.mockReturnValue(false);
    requestApplicationReset("ja");
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("未同期"));
    expect(await resetApplicationIfRequested()).toBe(false);
    expect(localStorage.getItem("tango-config")).toBe("saved settings");
    expect(sdk.auth.currentUser?.uid).toBe("previous-user");
    expect(cacheNames.has(ownedCache)).toBe(true);
    expect(replace).not.toHaveBeenCalled();
  });

  it("clears local state on the next startup while keeping other applications' data", async () => {
    requestApplicationReset("en");
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Data already synced to the cloud is kept"));
    expect(localStorage.getItem("tango-config")).toBe("saved settings");
    expect(sdk.clearPersistence).not.toHaveBeenCalled();
    replace.mockClear();

    expect(await resetApplicationIfRequested()).toBe(true);
    expect(sdk.clearPersistence).toHaveBeenCalledWith(sdk.db);
    expect(sdk.auth.currentUser).toBeNull();
    expect(localStorage.getItem("tango-config")).toBeNull();
    expect(localStorage.getItem("another-app")).toBe("keep");
    expect(cacheNames).toEqual(new Set([otherScopeCache, "another-app"]));
    expect(registeredScopes).toEqual(new Set(["https://tango.test/other/"]));
    expect(replace).toHaveBeenCalledWith("/");
    expect(await resetApplicationIfRequested()).toBe(false);
  });

  it("waits for persistence deletion before signing out or restarting", async () => {
    const clearing = Promise.withResolvers<void>();
    sdk.clearPersistence.mockReturnValue(clearing.promise);
    requestApplicationReset();
    replace.mockClear();
    const resetting = resetApplicationIfRequested();
    await vi.waitFor(() => expect(sdk.clearPersistence).toHaveBeenCalledWith(sdk.db));
    expect(sdk.auth.currentUser?.uid).toBe("previous-user");
    expect(localStorage.getItem("tango-config")).toBe("saved settings");
    expect(replace).not.toHaveBeenCalled();
    clearing.resolve();
    await resetting;
    expect(sdk.auth.currentUser).toBeNull();
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("leaves a failed reset to the startup error screen without an automatic retry", async () => {
    sdk.clearPersistence.mockRejectedValueOnce(new Error("another tab holds the cache"));
    requestApplicationReset();
    replace.mockClear();
    await expect(resetApplicationIfRequested()).rejects.toThrow("another tab holds the cache");
    expect(replace).not.toHaveBeenCalled();
    expect(localStorage.getItem("tango-config")).toBe("saved settings");
    expect(await resetApplicationIfRequested()).toBe(false);
  });

  it("reports unavailable browser storage without starting a reset", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    requestApplicationReset("en");
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("storage permissions"));
    expect(replace).not.toHaveBeenCalled();
  });
});
