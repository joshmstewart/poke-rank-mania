
import { StrictMode } from "react";
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

// STRATEGY 1: Parent-level logging for App.tsx lifecycle
const AppWrapper = () => {
  console.log('🟡🟡🟡 APP_WRAPPER: ===== RENDERING APP WRAPPER =====');
  console.log('🟡🟡🟡 APP_WRAPPER: About to render App.tsx at:', new Date().toISOString());
  console.log('🟡🟡🟡 APP_WRAPPER: This component is the direct parent of App.tsx');
  
  return (
    <div className="app-wrapper-diagnostic">
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        zIndex: 9999, 
        backgroundColor: 'orange', 
        color: 'white', 
        padding: '5px',
        fontSize: '12px'
      }}>
        🟡 APP WRAPPER RENDERED: {new Date().toLocaleTimeString()}
      </div>
      <App />
    </div>
  );
};

console.log('🔥🔥🔥 MAIN.TSX: About to render AppWrapper which contains App component');

root.render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);

console.log('🔥🔥🔥 MAIN.TSX: AppWrapper (containing App) has been rendered to DOM');
