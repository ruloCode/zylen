/// <reference types="vite-plugin-pwa/client" />

// PWA service-worker registration with reliable auto-update.
//
// vite.config.ts uses `registerType: "autoUpdate"`, which generates a service
// worker that calls skipWaiting()/clientsClaim(); `registerSW` from the virtual
// module then reloads the page automatically once the new worker takes control.
//
// The default injected registration (registerSW.js) does NOT do this — it only
// registers the worker — so importing the virtual module here is what actually
// gives users the latest deploy without a manual hard-refresh.
//
// On top of that we add two extra update triggers, because a long-lived mobile
// PWA session rarely performs the full navigation that would otherwise prompt
// the browser to check sw.js:
//   1. An hourly background check.
//   2. A check whenever the app returns to the foreground.
import { registerSW } from 'virtual:pwa-register';

// One hour: frequent enough that a same-day deploy reaches active users, cheap
// enough to be free in practice (an unchanged sw.js revalidates as a tiny 304).
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    // Never let an update check throw into the page; a failure just retries
    // on the next tick / next visibility change.
    const checkForUpdate = () => {
      registration.update().catch(() => {});
    };

    setInterval(checkForUpdate, UPDATE_INTERVAL_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });
  },
});
