import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCacheAndReload } from "./clear-cache";

const reload = vi.fn();
const alert = vi.fn();
const scope = "https://tango.test/";
const ownedCache = `workbox-precache-v2-${scope}`;
const otherCache = `workbox-precache-v2-${scope}other/`;
let cacheNames: Set<string>;
let scopes: Set<string>;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("tango-config", "saved settings");
  cacheNames = new Set([ownedCache, otherCache, "another-app"]);
  scopes = new Set([scope, `${scope}other/`]);
  const cacheStorage = {
    keys: async () => [...cacheNames],
    delete: async (name: string) => cacheNames.delete(name),
  };
  vi.stubGlobal("caches", cacheStorage);
  vi.stubGlobal("window", { caches: cacheStorage, alert, location: { origin: "https://tango.test", reload } });
  vi.stubGlobal("navigator", {
    language: "en",
    serviceWorker: {
      getRegistrations: async () =>
        [...scopes].map((registeredScope) => ({
          scope: registeredScope,
          unregister: async () => scopes.delete(registeredScope),
        })),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("NAVIGATION-03 cache recovery", () => {
  it("clears only Tango's worker and Workbox cache, preserving settings", async () => {
    await clearCacheAndReload();
    expect(scopes).toEqual(new Set([`${scope}other/`]));
    expect(cacheNames).toEqual(new Set([otherCache, "another-app"]));
    expect(localStorage.getItem("tango-config")).toBe("saved settings");
    expect(reload).toHaveBeenCalledOnce();
    expect(alert).not.toHaveBeenCalled();
  });

  it("waits for cache deletion before reloading", async () => {
    const deletion = Promise.withResolvers<boolean>();
    vi.spyOn(caches, "delete").mockReturnValue(deletion.promise);
    const recovery = clearCacheAndReload();
    await vi.waitFor(() => expect(caches.delete).toHaveBeenCalledWith(ownedCache));
    expect(reload).not.toHaveBeenCalled();
    deletion.resolve(true);
    await recovery;
    expect(reload).toHaveBeenCalledOnce();
  });

  it("reports a cache failure in the active language without reloading and permits retry", async () => {
    vi.spyOn(caches, "keys").mockRejectedValueOnce(new Error("storage blocked"));
    await clearCacheAndReload("ja");
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("キャッシュを削除できません"));
    expect(reload).not.toHaveBeenCalled();
    expect(localStorage.getItem("tango-config")).toBe("saved settings");
    await clearCacheAndReload("ja");
    expect(reload).toHaveBeenCalledOnce();
  });

  it("reloads when browser cache APIs are unavailable", async () => {
    vi.stubGlobal("navigator", { language: "en" });
    vi.stubGlobal("window", { alert, location: { origin: "https://tango.test", reload } });
    await clearCacheAndReload();
    expect(reload).toHaveBeenCalledOnce();
  });
});
