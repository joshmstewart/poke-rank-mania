
import React from 'react';
import { isDebugEnabled } from '@/utils/debug';

interface BattleLogDisplayProps {
  log: string[];
}

export const BattleLogDisplay: React.FC<BattleLogDisplayProps> = ({ log }) => {
  if (log.length === 0 || !isDebugEnabled()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-popover/95 text-popover-foreground p-3 rounded-lg shadow-lg max-w-xs w-[calc(100vw-2rem)] z-50 border border-border">
      <h4 className="text-sm font-bold border-b border-border pb-1 mb-2">Battle Strategy Log (debug)</h4>
      <ul className="text-xs space-y-1">
        {log.map((entry, index) => (
          <li key={index} className={`${index < 3 ? 'opacity-100' : index < 6 ? 'opacity-70' : 'opacity-50'}`}>
            <span className="font-mono bg-muted text-muted-foreground rounded px-1 py-0.5 mr-2 text-[10px]">
              #{log.length - index}
            </span>
            <span className="text-xs">{entry}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
