
import { useState, useEffect, useCallback } from 'react';

interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export const useConsoleCapture = () => {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    // Use a ref to prevent infinite loops
    let isUpdating = false;

    // Safe stringify function that handles circular references
    const safeStringify = (obj: any): string => {
      if (obj === null || obj === undefined) {
        return String(obj);
      }
      
      if (typeof obj !== 'object') {
        return String(obj);
      }
      
      // Handle DOM elements
      if (obj instanceof Element) {
        return `[DOM Element: ${obj.tagName}${obj.id ? '#' + obj.id : ''}${obj.className ? '.' + obj.className.split(' ').join('.') : ''}]`;
      }
      
      // Handle other objects with potential circular references
      try {
        return JSON.stringify(obj, (key, value) => {
          // Skip React fiber properties and DOM element properties that cause circular refs
          if (key.startsWith('__react') || key.startsWith('_react') || key === 'stateNode' || key === 'return' || key === 'child' || key === 'sibling') {
            return '[Circular Reference]';
          }
          
          // Handle DOM elements in nested objects
          if (value instanceof Element) {
            return `[DOM Element: ${value.tagName}]`;
          }
          
          return value;
        });
      } catch (error) {
        // Fallback for any remaining circular reference issues
        return `[Object: ${obj.constructor?.name || 'Unknown'}]`;
      }
    };

    const addLog = (level: ConsoleLog['level'], args: any[]) => {
      // Prevent infinite loops by checking if we're already updating
      if (isUpdating) return;
      
      const message = args.map(arg => safeStringify(arg)).join(' ');
      
      // Use setTimeout to batch updates and prevent render loops
      setTimeout(() => {
        isUpdating = true;
        setLogs(prev => [...prev.slice(-49), { // Keep last 50 logs
          level,
          message,
          timestamp: new Date().toISOString()
        }]);
        isUpdating = false;
      }, 0);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []); // Empty dependency array to prevent re-running

  const getLogsAsString = useCallback(() => {
    return logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
  }, [logs]);

  return { logs, getLogsAsString };
};
