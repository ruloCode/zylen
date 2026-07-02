// Run the Zylen → Everlight storage migration FIRST. This side-effect import
// must stay at the very top: it runs before any module that reads localStorage
// at import time (notably src/lib/supabase.ts, whose client restores the auth
// session on construction). ES-module post-order evaluation runs this module's
// body before later imports' dependency graphs.
import './services/migration';

import './index.css';
// Initialize i18n before app renders
import './services/i18n';
// Register the PWA service worker with reliable auto-update (see src/pwa.ts).
import './pwa';
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTheme, getStoredTheme } from "./utils/theme";

// Defensive: ensure the persisted theme is applied before render
// (the inline script in index.html handles the pre-paint/no-flash case).
applyTheme(getStoredTheme());

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(<App />);