
import React, { useState } from 'react';
import { useImpliedBattleTracker } from '@/contexts/ImpliedBattleTracker';

const PersistentLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [showImpliedBattles, setShowImpliedBattles] = useState(false);
  const { impliedBattles } = useImpliedBattleTracker();

  const retrieveLogs = () => {
    try {
      const stored = localStorage.getItem('debugPerfLogs');
      const parsedLogs = stored ? JSON.parse(stored) : [];
      setLogs(parsedLogs);
      setIsVisible(true);
      console.log('🔍 [PERSISTENT_LOG_VIEWER] Retrieved logs:', parsedLogs);
    } catch (e) {
      console.error('Failed to retrieve logs:', e);
      setLogs(['Error retrieving logs']);
    }
  };

  const clearLogs = () => {
    localStorage.removeItem('debugPerfLogs');
    setLogs([]);
    console.log('🔍 [PERSISTENT_LOG_VIEWER] Logs cleared');
  };

  const copyLogsToClipboard = () => {
    const logText = logs.join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      console.log('🔍 [PERSISTENT_LOG_VIEWER] Logs copied to clipboard');
      alert('Logs copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy logs:', err);
    });
  };

  const copyImpliedBattlesToClipboard = () => {
    const battleText = impliedBattles.map(battle => 
      `Battle #${battle.sequence} (${battle.timestamp}): ${battle.winner} beat ${battle.opponent} | Dragged: ${battle.draggedPokemon} | Type: ${battle.battleType}`
    ).join('\n');
    
    navigator.clipboard.writeText(battleText).then(() => {
      console.log('🔍 [PERSISTENT_LOG_VIEWER] Implied battles copied to clipboard');
      alert('Implied battles copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy implied battles:', err);
    });
  };

  if (!isVisible && !showImpliedBattles) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={retrieveLogs}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-600"
        >
          View Debug Logs
        </button>
        <button
          onClick={() => setShowImpliedBattles(true)}
          className="bg-green-500 text-white px-4 py-2 rounded shadow-lg hover:bg-green-600"
        >
          Implied Battles ({impliedBattles.length})
        </button>
      </div>
    );
  }

  if (showImpliedBattles) {
    return (
      <div className="fixed inset-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
          <h3 className="font-semibold">Implied Battles ({impliedBattles.length} entries)</h3>
          <div className="space-x-2">
            <button
              onClick={copyImpliedBattlesToClipboard}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Copy All
            </button>
            <button
              onClick={() => setShowImpliedBattles(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
        <div className="overflow-auto max-h-96 p-4">
          {impliedBattles.length === 0 ? (
            <p className="text-gray-500">No implied battles found</p>
          ) : (
            <div className="space-y-2">
              {impliedBattles.map((battle) => (
                <div key={battle.id} className="bg-gray-50 rounded p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Battle #{battle.sequence}</span>
                    <span className="text-xs text-gray-500">{battle.timestamp}</span>
                  </div>
                  <div className="text-sm">
                    <div className="mb-1">
                      <strong>Winner:</strong> {battle.winner}
                    </div>
                    <div className="mb-1">
                      <strong>Opponent:</strong> {battle.opponent}
                    </div>
                    <div className="mb-1">
                      <strong>Dragged Pokemon:</strong> {battle.draggedPokemon}
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Type:</strong> {battle.battleType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <h3 className="font-semibold">Persistent Debug Logs ({logs.length} entries)</h3>
        <div className="space-x-2">
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
          <p className="text-gray-500">No logs found</p>
        ) : (
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {logs.map((log, index) => (
              <div key={index} className="mb-1 border-b border-gray-100 pb-1">
                {log}
              </div>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
};

export default PersistentLogViewer;
