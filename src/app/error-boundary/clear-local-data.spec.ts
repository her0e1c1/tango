import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLocalDataAndReload, clearLocalDataBeforeStartup, isLocalDataResetRequested } from "./clear-local-data";

async function createDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onupgradeneeded = () => request.result.createObjectStore("records");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("NAVIGATION-22 Local data recovery", () => {
  it("requests a reload before deleting storage held by the running application", async () => {
    const reload = vi.fn();
    vi.stubGlobal("window", { location: { reload } });
    localStorage.setItem("settings", "old");
    expect(isLocalDataResetRequested()).toBe(false);
    await clearLocalDataAndReload();
    expect(isLocalDataResetRequested()).toBe(true);
    expect(localStorage.getItem("settings")).toBe("old");
    expect(reload).toHaveBeenCalledOnce();
  });

  it("removes every database and both storage areas before allowing startup", async () => {
    for (const name of ["firestore-cache", "authentication", "tango-card-replica", "other-data"]) {
      (await createDatabase(name)).close();
    }
    localStorage.setItem("settings", "old");
    sessionStorage.setItem("session", "old");
    await clearLocalDataBeforeStartup();
    expect(await indexedDB.databases()).toEqual([]);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("keeps a blocked reset retryable and clears storage after the other connection closes", async () => {
    const database = await createDatabase("other-tab");
    localStorage.setItem("settings", "old");
    sessionStorage.setItem("session", "old");
    await expect(clearLocalDataBeforeStartup()).rejects.toThrow("Close other Tango tabs");
    expect(localStorage.getItem("settings")).toBe("old");
    expect(sessionStorage.getItem("session")).toBe("old");
    database.close();
    await clearLocalDataBeforeStartup();
    expect(await indexedDB.databases()).toEqual([]);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("does not clear remaining storage if database enumeration fails", async () => {
    vi.spyOn(indexedDB, "databases").mockRejectedValueOnce(new Error("storage unavailable"));
    sessionStorage.setItem("session", "old");
    await expect(clearLocalDataBeforeStartup()).rejects.toThrow("storage unavailable");
    expect(sessionStorage.getItem("session")).toBe("old");
  });
});
