
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  category?: string;
  data?: any;
}

const PersistentLogViewer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const originalConsole = useRef<{
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  }>();

  // Enhanced console override with drag-and-drop focus
  useEffect(() => {
    if (!originalConsole.current) {
      originalConsole.current = {
        log: console.log,
        warn: console.warn,
        error: console.error
      };
    }

    const addLog = (level: LogEntry['level'], message: string, ...args: any[]) => {
      const timestamp = new Date().toISOString();
      let category = 'general';
      let formattedMessage = message;

      // Enhanced categorization for drag and drop debugging
      if (typeof message === 'string') {
        if (message.includes('DRAG') || message.includes('DROP') || message.includes('DND')) {
          category = 'drag-drop';
        } else if (message.includes('ENHANCED_DRAG') || message.includes('ENHANCED_DROP')) {
          category = 'enhanced-drag';
        } else if (message.includes('SORTABLE') || message.includes('DRAGGABLE')) {
          category = 'dnd-components';
        } else if (message.includes('VALIDATION') || message.includes('TARGET')) {
          category = 'drop-validation';
        } else if (message.includes('STATE_UPDATE') || message.includes('MANUAL_REORDER')) {
          category = 'state-management';
        } else if (message.includes('OPTIMIZED') || message.includes('RENDER')) {
          category = 'performance';
        } else if (message.includes('HOOK') || message.includes('useEffect')) {
          category = 'hooks';
        } else if (message.includes('ERROR') || message.includes('❌')) {
          category = 'errors';
        } else if (message.includes('✅') || message.includes('SUCCESS')) {
          category = 'success';
        }

        // Format special drag and drop messages
        if (args.length > 0) {
          formattedMessage = `${message} ${args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ')}`;
        }
      }

      setLogs(prev => [...prev.slice(-499), {
        timestamp,
        level,
        message: formattedMessage,
        category,
        data: args.length > 0 ? args : undefined
      }]);

      // Call original console method
      originalConsole.current![level === 'debug' ? 'log' : level](message, ...args);
    };

    console.log = (...args) => addLog('info', String(args[0]), ...args.slice(1));
    console.warn = (...args) => addLog('warn', String(args[0]), ...args.slice(1));
    console.error = (...args) => addLog('error', String(args[0]), ...args.slice(1));

    // Add some initial helpful logs for drag and drop debugging
    console.log('🔍 [DEBUG_VIEWER] PersistentLogViewer initialized - tracking drag and drop operations');
    console.log('🎯 [DND_DEBUG] Key drag and drop categories: drag-drop, enhanced-drag, dnd-components, drop-validation, state-management');

    return () => {
      if (originalConsole.current) {
        console.log = originalConsole.current.log;
        console.warn = originalConsole.current.warn;
        console.error = originalConsole.current.error;
      }
    };
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    return true;
  });

  const categories = ['all', ...Array.from(new Set(logs.map(log => log.category)))];
  const dragDropCategories = categories.filter(cat => 
    cat.includes('drag') || cat.includes('drop') || cat.includes('dnd') || cat.includes('validation') || cat.includes('state')
  );

  const clearLogs = () => {
    setLogs([]);
    console.log('🔍 [DEBUG_VIEWER] Logs cleared - ready for new drag and drop debugging session');
  };

  const exportLogs = () => {
    const logsText = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drag-drop-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warn': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    if (category.includes('drag') || category.includes('drop')) return 'bg-purple-100 text-purple-800';
    if (category.includes('error')) return 'bg-red-100 text-red-800';
    if (category.includes('state')) return 'bg-green-100 text-green-800';
    if (category.includes('validation')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          🔍 Debug Logs ({logs.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Debug Logs - Drag & Drop Focus</h2>
            <Badge variant="outline">{filteredLogs.length} entries</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear
            </Button>
            <Button onClick={exportLogs} variant="outline" size="sm">
              Export
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Level:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Category:</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              {dragDropCategories.length > 1 && (
                <optgroup label="Drag & Drop">
                  {dragDropCategories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              )}
              {categories.filter(cat => !dragDropCategories.includes(cat) && cat !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg font-medium">No logs match the current filters</p>
              <p className="text-sm mt-2">Try adjusting the level or category filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div 
                  key={index} 
                  className="border rounded p-2 text-xs hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <Badge className={`text-xs ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <Badge className={`text-xs ${getCategoryColor(log.category || 'general')}`}>
                      {log.category || 'general'}
                    </Badge>
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {log.message}
                  </div>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="text-gray-500 cursor-pointer">Additional data</summary>
                      <pre className="mt-1 text-gray-600 bg-gray-100 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PersistentLogViewer;
