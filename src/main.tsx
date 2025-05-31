
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('🔥🔥🔥 MAIN.TSX: React app starting up');

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

console.log('🔥🔥🔥 MAIN.TSX: About to render App component');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('🔥🔥🔥 MAIN.TSX: App component rendered');
