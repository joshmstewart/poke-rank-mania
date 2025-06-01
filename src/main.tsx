
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

// STRATEGY 1: Parent-level logging for App.tsx lifecycle with AGGRESSIVE monitoring
const AppWrapper = () => {
  const [renderCount, setRenderCount] = React.useState(0);
  const mountTimeRef = React.useRef(new Date().toISOString());
  const unmountDetectedRef = React.useRef(false);
  
  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
  });
  
  console.log('🟡🟡🟡 APP_WRAPPER: ===== RENDERING APP WRAPPER =====');
  console.log('🟡🟡🟡 APP_WRAPPER: About to render App.tsx at:', new Date().toISOString());
  console.log('🟡🟡🟡 APP_WRAPPER: This component is the direct parent of App.tsx');
  console.log('🟡🟡🟡 APP_WRAPPER: Render count:', renderCount);
  console.log('🟡🟡🟡 APP_WRAPPER: Mount time:', mountTimeRef.current);
  
  React.useEffect(() => {
    console.log('🟡🟡🟡 APP_WRAPPER: ===== APP WRAPPER MOUNTED =====');
    console.log('🟡🟡🟡 APP_WRAPPER: AppWrapper mounted at:', new Date().toISOString());
    
    // VERY aggressive monitoring - every 500ms
    const hyperMonitoring = setInterval(() => {
      if (unmountDetectedRef.current) {
        console.log('🟡🟡🟡 APP_WRAPPER: ⚠️ WRAPPER UNMOUNT DETECTED ⚠️');
        clearInterval(hyperMonitoring);
        return;
      }
      
      console.log('🟡🟡🟡 APP_WRAPPER: 🔍 HYPER-MONITORING - AppWrapper still alive:', {
        time: new Date().toLocaleTimeString(),
        renderCount: renderCount,
        aboutToRenderApp: 'YES'
      });
    }, 500);
    
    return () => {
      console.log('🟡🟡🟡 APP_WRAPPER: ===== APP WRAPPER UNMOUNTING =====');
      console.log('🟡🟡🟡 APP_WRAPPER: 🚨🚨🚨 APP WRAPPER IS UNMOUNTING 🚨🚨🚨');
      console.log('🟡🟡🟡 APP_WRAPPER: This would cause App.tsx to unmount too!');
      console.log('🟡🟡🟡 APP_WRAPPER: Unmount time:', new Date().toISOString());
      
      unmountDetectedRef.current = true;
      clearInterval(hyperMonitoring);
    };
  }, []);
  
  return (
    <div className="app-wrapper-diagnostic" key="app-wrapper-stable">
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
        🟡 APP WRAPPER RENDERED: {new Date().toLocaleTimeString()} | Render #{renderCount}
      </div>
      <App key="main-app-stable" />
    </div>
  );
};

console.log('🔥🔥🔥 MAIN.TSX: About to render AppWrapper which contains App component');

root.render(
  <StrictMode>
    <AppWrapper key="app-wrapper-root" />
  </StrictMode>
);

console.log('🔥🔥🔥 MAIN.TSX: AppWrapper (containing App) has been rendered to DOM');
