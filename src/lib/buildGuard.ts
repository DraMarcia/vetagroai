import { BUILD_ID } from "@/lib/buildInfo";

const STORAGE_KEY = "vetagro:build_id";
const RELOAD_GUARD_KEY = "vetagro:build_reload_guard";

async function clearBrowserCachesBestEffort() {
  // CacheStorage (not a Service Worker requirement) — some browsers/extensions may still use it.
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // best-effort
  }

  // Service Worker — repo search shows none, but keep defensive in case hosting layer injects one.
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // best-effort
  }
}

/**
 * If the browser is serving a stale JS bundle, force a one-time hard reload and clear caches.
 * This targets desktop issues where old cached JS keeps calling legacy payload/handlers.
 */
export async function ensureFreshDesktopBuild() {
  try {
    const previous = localStorage.getItem(STORAGE_KEY);
    if (!previous) {
      localStorage.setItem(STORAGE_KEY, BUILD_ID);
      return;
    }

    if (previous === BUILD_ID) return;

    // Prevent reload loops.
    const guard = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (guard === BUILD_ID) {
      localStorage.setItem(STORAGE_KEY, BUILD_ID);
      return;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, BUILD_ID);

    await clearBrowserCachesBestEffort();
    localStorage.setItem(STORAGE_KEY, BUILD_ID);

    // Hard reload with cache-busting param.
    const url = new URL(window.location.href);
    url.searchParams.set("v", BUILD_ID);
    window.location.replace(url.toString());
  } catch {
    // Never block app boot.
  }
}
