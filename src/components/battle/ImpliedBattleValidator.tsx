
import React from 'react';
import { useImpliedBattleTracker } from '@/contexts/ImpliedBattleTracker';

const ImpliedBattleValidator: React.FC = () => {
  const { impliedBattles, clearImpliedBattles } = useImpliedBattleTracker();

  if (impliedBattles.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-yellow-800">
            🔍 Implied Battle Validator (Last 6)
          </h3>
          <span className="text-xs text-yellow-600">No implied battles yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-yellow-800">
          🔍 Implied Battle Validator (Last 6)
        </h3>
        <button
          onClick={clearImpliedBattles}
          className="text-xs text-yellow-600 hover:text-yellow-800 underline"
        >
          Clear
        </button>
      </div>
      <div className="space-y-1">
        {impliedBattles.map((battle) => (
          <div key={battle.id} className="text-xs text-yellow-700 font-mono">
            [{battle.timestamp}] Seq#{battle.sequence}: {battle.winner} def. {battle.opponent === battle.winner ? battle.draggedPokemon : battle.opponent} ({battle.battleType})
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImpliedBattleValidator;
