
import React from 'react';

interface ImpliedBattle {
  id: string;
  draggedPokemon: string;
  opponent: string;
  winner: string;
  battleType: string;
  timestamp: string;
}

interface ImpliedBattleTrackerProps {
  battles: ImpliedBattle[];
}

const ImpliedBattleTracker: React.FC<ImpliedBattleTrackerProps> = ({ battles }) => {
  if (battles.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-4 mb-4">
      <h3 className="text-sm font-semibold text-yellow-800 mb-2">
        🔍 Implied Battle Validation (Last {battles.length} Updates)
      </h3>
      <div className="space-y-1">
        {battles.map((battle, index) => (
          <div key={battle.id} className="text-xs text-yellow-700 font-mono">
            [{battles.length - index}] Implied: {battle.winner} def. {battle.draggedPokemon === battle.winner ? battle.opponent : battle.draggedPokemon} ({battle.battleType})
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImpliedBattleTracker;
