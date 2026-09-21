import { getRecoveryMessages } from "./messages";

const RESET_REQUEST_KEY = "tango-startup-reset";

export function requestApplicationReset(language?: string): void {
  const messages = getRecoveryMessages(language);
  if (!window.confirm(messages.confirm)) return;

  try {
    sessionStorage.setItem(RESET_REQUEST_KEY, "1");
    // The next document clears persistence before the auth lifecycle can restore or upload cached writes.
    window.location.replace(import.meta.env.BASE_URL);
  } catch {
    window.alert(messages.resetFailed);
  }
}

export async function resetApplicationIfRequested(): Promise<boolean> {
  let requested: boolean;
  try {
    requested = sessionStorage.getItem(RESET_REQUEST_KEY) === "1";
  } catch {
    // Optional recovery storage must not prevent an ordinary application startup.
    return false;
  }
  if (!requested) return false;
  // Consume the request before doing any work: a failed reset must not create an automatic retry loop.
  sessionStorage.removeItem(RESET_REQUEST_KEY);
  const root = document.getElementById("root");
  if (root) root.textContent = getRecoveryMessages().resetting;

  const [{ auth, db }, { clearIndexedDbPersistence }, { signOut }] = await Promise.all([
    import("@/shared/firebase"),
    import("firebase/firestore"),
    import("firebase/auth"),
  ]);
  // No normal application module has been imported yet, so Firestore has not started.
  await clearIndexedDbPersistence(db);
  await signOut(auth);
  localStorage.removeItem("tango-config");

  const scope = new URL(import.meta.env.BASE_URL, window.location.origin).href;
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => registration.scope === scope)
        .map((registration) => registration.unregister())
    );
  }
  if ("caches" in window) {
    const names = await caches.keys();
    // Workbox's default cache names end with the registration scope. Do not clear another app's caches.
    await Promise.all(
      names.filter((name) => name.startsWith("workbox-") && name.endsWith(scope)).map((name) => caches.delete(name))
    );
  }

  window.location.replace(import.meta.env.BASE_URL);
  return true;
}
