
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Silence verbose console.log/info/debug unless the user opts in via
// `localStorage.setItem('debug', '1')`. The codebase has 300+ log statements
// that fire on every render and every drag-over event; in DevTools, each
// stringification blocks the main thread and was the primary source of drag
// lag. console.warn / console.error remain enabled.
if (typeof window !== "undefined") {
  const debugEnabled = (() => {
    try {
      return localStorage.getItem("debug") === "1";
    } catch {
      return false;
    }
  })();
  if (!debugEnabled) {
    const noop = () => {};
    // eslint-disable-next-line no-console
    console.log = noop;
    // eslint-disable-next-line no-console
    console.info = noop;
    // eslint-disable-next-line no-console
    console.debug = noop;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
