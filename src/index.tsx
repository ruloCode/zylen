import './index.css';
// Initialize i18n before app renders
import './services/i18n';
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