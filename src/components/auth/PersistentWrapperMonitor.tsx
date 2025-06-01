
import React, { useEffect, useState, useRef } from 'react';

export const PersistentWrapperMonitor: React.FC = () => {
  const [status, setStatus] = useState('INITIALIZING');
  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  const mountTimeRef = useRef(new Date().toISOString());

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    console.log('🛡️🛡️🛡️ PERSISTENT_WRAPPER_MONITOR:', logEntry);
    setLogs(prev => [...prev.slice(-4), logEntry]); // Keep last 5 logs
  };

  useEffect(() => {
    addLog('PERSISTENT MONITOR MOUNTED - WATCHING FOR WRAPPER FAILURES');
    setStatus('MONITORING');

    // Check for wrapper elements every second
    intervalRef.current = setInterval(() => {
      const nawgti = document.querySelector('[style*="nawgti"]') || 
                    document.querySelector('[class*="auth-wrapper"]');
      const appContent = document.querySelector('[style*="app-content"]') || 
                        document.querySelector('[style*="purple"]');
      
      const nawgtiExists = !!nawgti;
      const appContentExists = !!appContent;
      
      if (!nawgtiExists || !appContentExists) {
        addLog(`WRAPPER FAILURE DETECTED! nawgti: ${nawgtiExists}, appContent: ${appContentExists}`);
        setStatus('WRAPPER_FAILURE_DETECTED');
      } else {
        setStatus('WRAPPERS_VISIBLE');
      }
    }, 1000);

    return () => {
      addLog('PERSISTENT MONITOR UNMOUNTING');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const statusColor = status === 'WRAPPER_FAILURE_DETECTED' ? '#ff0000' : 
                     status === 'WRAPPERS_VISIBLE' ? '#00ff00' : '#ffaa00';

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      zIndex: 99998,
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '15px',
      border: '3px solid #ffffff',
      fontSize: '12px',
      maxWidth: '400px',
      fontFamily: 'monospace'
    }}>
      <div style={{ color: statusColor, fontWeight: 'bold', marginBottom: '10px' }}>
        🛡️ PERSISTENT WRAPPER MONITOR
      </div>
      <div>
        Status: <span style={{ color: statusColor }}>{status}</span><br/>
        Mount: {new Date(mountTimeRef.current).toLocaleTimeString()}<br/>
        <div style={{ marginTop: '5px', fontSize: '10px' }}>
          Recent Logs:
          {logs.map((log, i) => (
            <div key={i} style={{ color: '#cccccc' }}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
