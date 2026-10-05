import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

export async function setCachedCardFsrs(page: Page, cardId: string, fsrs: "missing" | null = "missing") {
  // /__/ is excluded from the production worker's navigation fallback, so this unloads the SDK in both builds.
  await page.route("**/__/storage-maintenance", (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Storage maintenance</title>" })
  );
  await page.goto("/__/storage-maintenance");

  const changed = await page.evaluate(
    async ({ id, fsrsValue }) => {
      const name = (await indexedDB.databases()).find(
        (entry) => entry.name === "firestore/[DEFAULT]/tango-e2e/main"
      )?.name;
      if (name === undefined) throw new Error("The isolated Firestore cache is missing");
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const counts = { mutations: 0, documentOverlays: 0 };
      type Mutation = { update?: { name: string; fields: Record<string, unknown> } };
      const changeFsrs = (mutation: Mutation | undefined) => {
        const document = mutation?.update;
        if (!document?.name.endsWith(`/documents/card/${id}`)) return false;
        // Restoration also verifies the application left the invalid saved value intact.
        if ("fsrs" in document.fields !== (fsrsValue === "missing")) return false;
        if (fsrsValue === "missing") {
          document.fields = Object.fromEntries(Object.entries(document.fields).filter(([field]) => field !== "fsrs"));
        } else document.fields.fsrs = { nullValue: "NULL_VALUE" };
        return true;
      };
      try {
        // Anonymous writes remain pending. Change both SDK representations of only this Card's persisted value.
        await new Promise<void>((resolve, reject) => {
          const transaction = database.transaction(["mutations", "documentOverlays"], "readwrite");
          transaction.oncomplete = () => resolve();
          transaction.onabort = () => reject(transaction.error);
          transaction.onerror = () => reject(transaction.error);
          for (const storeName of ["mutations", "documentOverlays"] as const) {
            const request = transaction.objectStore(storeName).openCursor();
            request.onsuccess = () => {
              const cursor = request.result;
              if (cursor === null) return;
              const row = cursor.value as { mutations?: Mutation[]; overlayMutation?: Mutation };
              const removed = (row.mutations ?? [row.overlayMutation]).filter(changeFsrs).length;
              counts[storeName] += removed;
              if (removed > 0) cursor.update(row);
              cursor.continue();
            };
          }
        });
      } finally {
        database.close();
      }
      return counts;
    },
    { id: cardId, fsrsValue: fsrs }
  );
  expect(changed.mutations).toBeGreaterThan(0);
  expect(changed.documentOverlays).toBe(1);
}
