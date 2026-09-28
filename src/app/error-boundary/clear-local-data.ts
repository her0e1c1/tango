const RESET_REQUEST = "tango-clear-local-data";

export function isLocalDataResetRequested(): boolean {
  return sessionStorage.getItem(RESET_REQUEST) === "1";
}

export function clearLocalDataAndReload(): Promise<void> {
  return Promise.resolve().then(() => {
    // Reload first so Firebase Auth, Firestore and other clients release their IndexedDB connections.
    sessionStorage.setItem(RESET_REQUEST, "1");
    window.location.reload();
  });
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Unable to delete local database"));
    request.onblocked = () => reject(new Error("Close other Tango tabs or windows and try again"));
  });
}

export async function clearLocalDataBeforeStartup(): Promise<void> {
  const databases = await indexedDB.databases();
  await Promise.all(databases.flatMap(({ name }) => (name === undefined ? [] : [deleteDatabase(name)])));
  localStorage.clear();
  // Remove the request only after every other deletion succeeds, so a failed reset remains retryable.
  sessionStorage.clear();
}
