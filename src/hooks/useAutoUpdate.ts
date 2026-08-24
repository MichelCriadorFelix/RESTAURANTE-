import { useEffect } from 'react';

// After a new deploy, a device can be left with an old cached app shell
// that references JS/CSS files which no longer exist on the server,
// producing a blank white screen with no error the ErrorBoundary can
// catch (the broken bundle never even runs). Since the client (restaurant
// owner) can't be expected to manually clear the site's cache, this
// polls a plain, never-cached version.json and self-heals: if the
// deployed build differs from the one currently running, it wipes the
// service worker + caches and forces a clean reload.
const RELOAD_GUARD_KEY = 'sg_last_version_reload';
const RELOAD_GUARD_WINDOW_MS = 15000;
const POLL_INTERVAL_MS = 5 * 60 * 1000;

async function clearServiceWorkerState() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch {
    // best-effort cleanup; a stuck reload loop is worse than a skipped one
  }
}

async function checkForNewVersion() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.buildId || data.buildId === __APP_BUILD_ID__) return;

    const lastReload = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (lastReload && Date.now() - Number(lastReload) < RELOAD_GUARD_WINDOW_MS) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));

    await clearServiceWorkerState();
    window.location.reload();
  } catch {
    // offline or network hiccup; try again on the next poll/visibility change
  }
}

export function useAutoUpdate() {
  useEffect(() => {
    checkForNewVersion();

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForNewVersion();
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(checkForNewVersion, POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);
}
