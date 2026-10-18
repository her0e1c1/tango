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
  // Given: Establish the shared setup used by the following cases.
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("NAVIGATION-22 Local data recovery", () => {
  it("requests a reload before deleting storage held by the running application", async () => {
    // Given: Prepare `reload` and any shared test state below.
    const reload = vi.fn();
    vi.stubGlobal("window", { location: { reload } });
    localStorage.setItem("settings", "old");
    // Given: Confirm that no reset has been requested yet.
    expect(isLocalDataResetRequested()).toBe(false);
    // When: Exercise `clearLocalDataAndReload` with the prepared inputs.
    await clearLocalDataAndReload();
    // Then: Verify the expected result in the assertions below.
    expect(isLocalDataResetRequested()).toBe(true);
    expect(localStorage.getItem("settings")).toBe("old");
    expect(reload).toHaveBeenCalledOnce();
  });

  it("removes every database and both storage areas before allowing startup", async () => {
    // Given: Use this case's inputs and any shared test setup.
    for (const name of ["firestore-cache", "authentication", "tango-card-replica", "other-data"]) {
      (await createDatabase(name)).close();
    }
    localStorage.setItem("settings", "old");
    sessionStorage.setItem("session", "old");
    // When: Exercise `clearLocalDataBeforeStartup` with the prepared inputs.
    await clearLocalDataBeforeStartup();
    // Then: Verify the expected result in the assertions below.
    expect(await indexedDB.databases()).toEqual([]);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("keeps a blocked reset retryable and clears storage after the other connection closes", async () => {
    // Given: Prepare `database` and any shared test state below.
    const database = await createDatabase("other-tab");
    localStorage.setItem("settings", "old");
    sessionStorage.setItem("session", "old");
    // When: Attempt startup cleanup while database enumeration fails.
    // Then: Report the enumeration error and preserve the remaining session storage.
    await expect(clearLocalDataBeforeStartup()).rejects.toThrow("Close other Tango tabs");
    expect(localStorage.getItem("settings")).toBe("old");
    expect(sessionStorage.getItem("session")).toBe("old");
    // When: Exercise `database.close` with the prepared inputs.
    database.close();
    await clearLocalDataBeforeStartup();
    // Then: Verify the expected result in the assertions below.
    expect(await indexedDB.databases()).toEqual([]);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("does not clear remaining storage if database enumeration fails", async () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.spyOn(indexedDB, "databases").mockRejectedValueOnce(new Error("storage unavailable"));
    sessionStorage.setItem("session", "old");
    // When: Attempt startup cleanup while database enumeration fails.
    // Then: Report the enumeration error and preserve the remaining session storage.
    await expect(clearLocalDataBeforeStartup()).rejects.toThrow("storage unavailable");
    expect(sessionStorage.getItem("session")).toBe("old");
  });
});
