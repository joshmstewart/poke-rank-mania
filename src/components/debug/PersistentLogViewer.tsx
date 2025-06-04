
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  category?: string;
}

const PersistentLogViewer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Enhanced drag-specific keywords and patterns
  const dragKeywords = [
    '[EXPLICIT_DRAG_END]', '[EXPLICIT_DRAG_START]', '[POKEMON_MOVE]', '[POKEMON_REORDER]',
    '[COLLISION_DETECTION]', '[DROPPABLE_INIT]', '[DRAGGABLE_CARD_INIT]',
    '[AVAILABLE_CARD_INIT]', '[RANKED_POKEMON_INIT]', '[AVAILABLE_HOOK_DETAILED]',
    '[DRAG_START]', '[DRAG_END]', '[DRAG_OVER]', '[DRAG_EVENT]',
    '[SORTABLE_CONTEXT]', '[DRAGGABLE_CONTEXT]', '[SENSORS_INIT]',
    'useDraggable', 'useDroppable', 'useSortable', 'DndContext',
    'available-', 'ranking-', 'collision', 'droppable', 'draggable'
  ];

  // Capture console logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    const captureLog = (level: string, args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // CRITICAL FIX: Prevent infinite loop by ignoring our own log capture messages
      if (message.includes('[PERSISTENT_LOG_VIEWER]') || message.includes('🔍')) {
        return; // Don't capture our own logs
      }

      // Check if this is a drag-related log
      const isDragRelated = dragKeywords.some(keyword => 
        message.includes(keyword) || 
        (typeof args[0] === 'string' && args[0].includes(keyword))
      );

      if (isDragRelated) {
        const logEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          level,
          message,
          category: 'drag-debug'
        };

        setLogs(prev => {
          const newLogs = [...prev, logEntry].slice(-100); // Reduced to 100 logs for performance
          return newLogs;
        });
      }
    };

    console.log = (...args) => {
      originalConsoleLog(...args);
      captureLog('info', args);
    };

    console.info = (...args) => {
      originalConsoleInfo(...args);
      captureLog('info', args);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      captureLog('warn', args);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      captureLog('error', args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.info = originalConsoleInfo;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, []);

  // Filter logs based on search and category
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedCategory]);

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const categories = ['all', ...Array.from(new Set(logs.map(log => log.category).filter(Boolean)))];

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          View Drag Debug Logs ({logs.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Drag Debug Logs ({filteredLogs.length}/{logs.length})</h2>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1 border rounded text-sm w-40"
              />
            </div>

            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <Button 
              onClick={clearLogs}
              variant="outline" 
              size="sm"
              className="flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </Button>
          </div>

          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {logs.length === 0 ? (
                  <div>
                    <p className="text-lg font-medium">No drag debug logs captured yet</p>
                    <p className="text-sm mt-2">Start dragging Pokémon to see detailed debug information here</p>
                  </div>
                ) : (
                  <p>No logs match your search criteria</p>
                )}
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded text-xs font-mono border-l-4 ${
                    log.level === 'error' ? 'bg-red-50 border-red-400' :
                    log.level === 'warn' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-gray-500 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()} - {log.level.toUpperCase()}
                        {log.category && <span className="ml-2 bg-gray-200 px-1 rounded">{log.category}</span>}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap break-words">
                        {log.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="font-medium">Drag Events</div>
              <div className="text-gray-600">
                {logs.filter(l => l.message.includes('[EXPLICIT_DRAG_START]') || l.message.includes('[EXPLICIT_DRAG_END]')).length} logs
              </div>
            </div>
            <div>
              <div className="font-medium">Pokémon Moves</div>
              <div className="text-gray-600">
                {logs.filter(l => l.message.includes('[POKEMON_MOVE]') || l.message.includes('[POKEMON_REORDER]')).length} logs
              </div>
            </div>
            <div>
              <div className="font-medium">Collision Detection</div>
              <div className="text-gray-600">
                {logs.filter(l => l.message.includes('[COLLISION_DETECTION]')).length} logs
              </div>
            </div>
            <div>
              <div className="font-medium">Card Init</div>
              <div className="text-gray-600">
                {logs.filter(l => l.message.includes('[DRAGGABLE_CARD_INIT]')).length} logs
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PersistentLogViewer;
