
import React from 'react';
import { Button } from '@/components/ui/button';
import { RankedPokemon } from '@/hooks/battle/useRankings';

interface MilestoneDisplayProps {
  milestone: { rankings: RankedPokemon[], battles: any[] };
  battleHistory: any[];
  onContinue: () => void;
}

const MilestoneDisplay: React.FC<MilestoneDisplayProps> = ({
  milestone,
  battleHistory,
  onContinue
}) => {
  return (
    <div className="flex flex-col items-center mt-6 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Milestone Reached!</h2>
      <p className="mb-6">
        You've completed {battleHistory.length} battles! Here's a snapshot of your current rankings.
      </p>
      
      <div className="w-full max-h-96 overflow-y-auto mb-4">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Rank</th>
              <th className="border p-2 text-left">Pokémon</th>
              <th className="border p-2 text-left">Score</th>
              <th className="border p-2 text-left">Battles</th>
            </tr>
          </thead>
          <tbody>
            {milestone.rankings.slice(0, 15).map((pokemon, index) => (
              <tr key={pokemon.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2 flex items-center">
                  {pokemon.image && (
                    <img
                      src={pokemon.image}
                      alt={pokemon.name}
                      className="w-10 h-10 mr-2"
                    />
                  )}
                  {pokemon.name}
                </td>
                <td className="border p-2">{pokemon.score.toFixed(2)}</td>
                <td className="border p-2">{pokemon.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Button onClick={onContinue} className="mt-4">
        Continue Battling
      </Button>
    </div>
  );
};

export default MilestoneDisplay;
