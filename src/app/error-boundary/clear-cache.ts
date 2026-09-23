import { getRecoveryMessages } from "../i18n/resources";

export async function clearCacheAndReload(language?: string): Promise<void> {
  try {
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
      // Workbox's default cache names end with the registration scope; preserve other apps' caches.
      await Promise.all(
        names.filter((name) => name.startsWith("workbox-") && name.endsWith(scope)).map((name) => caches.delete(name))
      );
    }
    window.location.reload();
  } catch {
    window.alert(getRecoveryMessages(language).clearCacheFailed);
  }
}
