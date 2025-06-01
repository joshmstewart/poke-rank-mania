
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('🔥🔥🔥 MAIN.TSX: ===== APPLICATION STARTUP =====');
console.log('🔥🔥🔥 MAIN.TSX: React app starting up at:', new Date().toISOString());

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('🔥🔥🔥 MAIN.TSX: ❌ ROOT ELEMENT NOT FOUND ❌');
  throw new Error("Root element not found");
}

console.log('🔥🔥🔥 MAIN.TSX: Root element found, creating React root');

const root = createRoot(rootElement);

console.log('🔥🔥🔥 MAIN.TSX: About to render App component directly');

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('🔥🔥🔥 MAIN.TSX: App has been rendered to DOM');
