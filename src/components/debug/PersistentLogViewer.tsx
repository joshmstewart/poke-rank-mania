
import React, { useState, useEffect } from 'react';

const PersistentLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);

  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  useEffect(() => {
    if (isAutoCapturing) {
      // Override console methods to capture drag-related logs
      console.log = (...args) => {
        const message = args.join(' ');
        const timestamp = new Date().toISOString();
        
        // Capture drag-related logs
        if (message.includes('DRAG') || 
            message.includes('COLLISION') || 
            message.includes('SORTABLE') || 
            message.includes('DROPPABLE') ||
            message.includes('ENHANCED_') ||
            message.includes('available-') ||
            message.includes('ranking-') ||
            message.includes('onDragStart') ||
            message.includes('onDragEnd') ||
            message.includes('onDragOver') ||
            message.includes('useDraggable') ||
            message.includes('useSortable') ||
            message.includes('SortableContext') ||
            message.includes('DndContext')) {
          
          const logEntry = `[${timestamp}] ${message}`;
          
          // Store in localStorage for persistence
          const existingLogs = JSON.parse(localStorage.getItem('dragDebugLogs') || '[]');
          const updatedLogs = [...existingLogs, logEntry].slice(-200); // Keep last 200 logs
          localStorage.setItem('dragDebugLogs', JSON.stringify(updatedLogs));
          
          setLogs(prev => [...prev, logEntry].slice(-200));
        }
        
        // Call original console.log
        originalConsoleLog(...args);
      };

      console.error = (...args) => {
        const message = args.join(' ');
        const timestamp = new Date().toISOString();
        const logEntry = `[ERROR][${timestamp}] ${message}`;
        
        // Store errors
        const existingLogs = JSON.parse(localStorage.getItem('dragDebugLogs') || '[]');
        const updatedLogs = [...existingLogs, logEntry].slice(-200);
        localStorage.setItem('dragDebugLogs', JSON.stringify(updatedLogs));
        
        setLogs(prev => [...prev, logEntry].slice(-200));
        originalConsoleError(...args);
      };

      console.warn = (...args) => {
        const message = args.join(' ');
        const timestamp = new Date().toISOString();
        const logEntry = `[WARN][${timestamp}] ${message}`;
        
        // Store warnings
        const existingLogs = JSON.parse(localStorage.getItem('dragDebugLogs') || '[]');
        const updatedLogs = [...existingLogs, logEntry].slice(-200);
        localStorage.setItem('dragDebugLogs', JSON.stringify(updatedLogs));
        
        setLogs(prev => [...prev, logEntry].slice(-200));
        originalConsoleWarn(...args);
      };
    }

    return () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [isAutoCapturing]);

  const retrieveLogs = () => {
    try {
      const stored = localStorage.getItem('dragDebugLogs');
      const parsedLogs = stored ? JSON.parse(stored) : [];
      setLogs(parsedLogs);
      setIsVisible(true);
      console.log('🔍 [PERSISTENT_LOG_VIEWER] Retrieved drag debug logs:', parsedLogs.length);
    } catch (e) {
      console.error('Failed to retrieve logs:', e);
      setLogs(['Error retrieving logs']);
    }
  };

  const clearLogs = () => {
    localStorage.removeItem('dragDebugLogs');
    setLogs([]);
    console.log('🔍 [PERSISTENT_LOG_VIEWER] Drag debug logs cleared');
  };

  const copyLogsToClipboard = () => {
    const logText = logs.join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      console.log('🔍 [PERSISTENT_LOG_VIEWER] Logs copied to clipboard');
      alert('Drag debug logs copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy logs:', err);
    });
  };

  const startAutoCapture = () => {
    setIsAutoCapturing(true);
    setLogs([]);
    localStorage.removeItem('dragDebugLogs');
    console.log('🔍 [PERSISTENT_LOG_VIEWER] Started auto-capturing drag debug logs');
  };

  const stopAutoCapture = () => {
    setIsAutoCapturing(false);
    console.log('🔍 [PERSISTENT_LOG_VIEWER] Stopped auto-capturing drag debug logs');
  };

  const exportDetailedReport = () => {
    const report = [
      '=== DRAG & DROP DEBUG REPORT ===',
      `Generated: ${new Date().toISOString()}`,
      `Total Logs: ${logs.length}`,
      '',
      '=== COLLISION DETECTION LOGS ===',
      ...logs.filter(log => log.includes('COLLISION')),
      '',
      '=== DRAG START/END LOGS ===',
      ...logs.filter(log => log.includes('DRAG_START') || log.includes('DRAG_END')),
      '',
      '=== SORTABLE/DRAGGABLE HOOK LOGS ===',
      ...logs.filter(log => log.includes('useDraggable') || log.includes('useSortable')),
      '',
      '=== CONTEXT LOGS ===',
      ...logs.filter(log => log.includes('SortableContext') || log.includes('DndContext')),
      '',
      '=== ID VERIFICATION LOGS ===',
      ...logs.filter(log => log.includes('available-') || log.includes('ranking-')),
      '',
      '=== ERROR LOGS ===',
      ...logs.filter(log => log.includes('[ERROR]') || log.includes('[WARN]')),
      '',
      '=== ALL LOGS ===',
      ...logs
    ].join('\n');

    navigator.clipboard.writeText(report).then(() => {
      alert('Detailed debug report copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy report:', err);
    });
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <div className="flex flex-col space-y-2">
          <button
            onClick={retrieveLogs}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-600"
          >
            View Drag Debug Logs ({logs.length})
          </button>
          
          {!isAutoCapturing ? (
            <button
              onClick={startAutoCapture}
              className="bg-green-500 text-white px-4 py-2 rounded shadow-lg hover:bg-green-600"
            >
              Start Auto-Capture
            </button>
          ) : (
            <button
              onClick={stopAutoCapture}
              className="bg-orange-500 text-white px-4 py-2 rounded shadow-lg hover:bg-orange-600"
            >
              Stop Auto-Capture
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold">
            Drag Debug Logs ({logs.length} entries)
            {isAutoCapturing && <span className="text-green-600 ml-2">● Auto-Capturing</span>}
          </h3>
        </div>
        <div className="space-x-2">
          {!isAutoCapturing ? (
            <button
              onClick={startAutoCapture}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Start Capture
            </button>
          ) : (
            <button
              onClick={stopAutoCapture}
              className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
            >
              Stop Capture
            </button>
          )}
          <button
            onClick={exportDetailedReport}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
          >
            Export Report
          </button>
          <button
            onClick={copyLogsToClipboard}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Copy All
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-96 p-4">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">No drag debug logs captured yet</p>
            <p className="text-sm">
              {isAutoCapturing 
                ? "Auto-capturing is active. Try dragging a Pokémon card to see logs appear here."
                : "Start auto-capture and try dragging a Pokémon card to debug the interaction."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`text-xs font-mono p-2 rounded ${
                  log.includes('[ERROR]') ? 'bg-red-100 text-red-800' :
                  log.includes('[WARN]') ? 'bg-yellow-100 text-yellow-800' :
                  log.includes('COLLISION') ? 'bg-blue-100 text-blue-800' :
                  log.includes('DRAG_START') || log.includes('DRAG_END') ? 'bg-green-100 text-green-800' :
                  log.includes('available-') || log.includes('ranking-') ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {logs.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 border-t text-sm text-gray-600">
          <div className="flex justify-between">
            <span>
              Errors: {logs.filter(l => l.includes('[ERROR]')).length} | 
              Warnings: {logs.filter(l => l.includes('[WARN]')).length} | 
              Collisions: {logs.filter(l => l.includes('COLLISION')).length}
            </span>
            <span>
              Last updated: {logs.length > 0 ? logs[logs.length - 1].match(/\[(.*?)\]/)?.[1] || 'Unknown' : 'Never'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersistentLogViewer;
