
import React from 'react';

interface BattleLogDisplayProps {
  log: string[];
}

export const BattleLogDisplay: React.FC<BattleLogDisplayProps> = ({ log }) => {
  if (log.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 bg-opacity-90 text-white p-3 rounded-lg shadow-lg max-w-xs w-full z-50">
      <h4 className="text-sm font-bold border-b border-gray-600 pb-1 mb-2">Battle Strategy Log</h4>
      <ul className="text-xs space-y-1">
        {log.map((entry, index) => (
          <li key={index} className={`${index < 3 ? 'opacity-100' : index < 6 ? 'opacity-70' : 'opacity-50'}`}>
            <span className="font-mono bg-gray-700 rounded px-1 py-0.5 mr-2 text-[10px]">
              #{log.length - index}
            </span>
            <span className="text-xs">{entry}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
