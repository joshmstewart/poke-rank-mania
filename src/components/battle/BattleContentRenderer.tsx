
import React from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import BattleControls from "./BattleControls";
import ImpliedBattleValidator from "./ImpliedBattleValidator";

interface BattleContentRendererProps {
  showingMilestone: boolean;
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: any[];
  selectedGeneration: number;
  finalRankings: RankedPokemon[];
  activeTier: TopNOption;
  milestones: number[];
  rankingGenerated: boolean;
  isAnyProcessing: boolean;
  setSelectedGeneration: (gen: number) => void;
  setBattleType: (type: BattleType) => void;
  setShowingMilestone: (showing: boolean) => void;
  setActiveTier: (tier: TopNOption) => void;
  handlePokemonSelect: (pokemonId: number) => void;
  handleTripletSelectionComplete: () => void;
  goBack: () => void;
  handleContinueBattles: () => void;
  performFullBattleReset: () => void;
  handleSaveRankings: () => void;
  suggestRanking: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  removeSuggestion: (pokemonId: number) => void;
  resetMilestoneInProgress: () => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContentRenderer: React.FC<BattleContentRendererProps> = ({
  showingMilestone,
  currentBattle,
  selectedPokemon,
  battlesCompleted,
  battleType,
  battleHistory,
  selectedGeneration,
  finalRankings,
  activeTier,
  milestones,
  rankingGenerated,
  isAnyProcessing,
  setSelectedGeneration,
  setBattleType,
  setShowingMilestone,
  setActiveTier,
  handlePokemonSelect,
  handleTripletSelectionComplete,
  goBack,
  handleContinueBattles,
  performFullBattleReset,
  handleSaveRankings,
  suggestRanking,
  removeSuggestion,
  resetMilestoneInProgress,
  handleManualReorder,
  onRankingsUpdate
}) => {
  console.log(`🎮 [RENDERER] BattleContentRenderer render`);

  // For milestone, show existing milestone interface
  if (showingMilestone) {
    return (
      <div className="space-y-4">
        <ImpliedBattleValidator />
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Milestone Reached!</h2>
          <p className="mb-4">
            Congratulations! You've completed {battlesCompleted} battles.
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <button 
                onClick={handleContinueBattles}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                Continue Battles
              </button>
              <button 
                onClick={performFullBattleReset}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                Start New Battle Set
              </button>
            </div>

            {finalRankings.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Current Rankings</h3>
                {finalRankings.slice(0, 10).map((pokemon, index) => (
                  <div key={pokemon.id} className="flex items-center space-x-4 p-2 border rounded">
                    <span className="font-bold">#{index + 1}</span>
                    <img src={pokemon.image} alt={pokemon.name} className="w-8 h-8" />
                    <span>{pokemon.name}</span>
                    <span className="text-sm text-gray-500">Score: {pokemon.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ImpliedBattleValidator />
      
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        onGenerationChange={(gen) => setSelectedGeneration(Number(gen))}
        onBattleTypeChange={setBattleType}
        onReset={performFullBattleReset}
        battleHistory={battleHistory}
      />

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Battle Mode</h2>
        
        {currentBattle.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {currentBattle.map((pokemon, index) => (
              <div 
                key={pokemon.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPokemon.includes(pokemon.id) ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                }`}
                onClick={() => handlePokemonSelect(pokemon.id)}
              >
                <img src={pokemon.image} alt={pokemon.name} className="w-16 h-16 mx-auto mb-2" />
                <h3 className="text-center font-medium">{pokemon.name}</h3>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">Loading battle...</p>
        )}
        
        {selectedPokemon.length === 2 && (
          <div className="mt-4 text-center">
            <button 
              onClick={handleTripletSelectionComplete}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
            >
              Submit Battle Result
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleContentRenderer;
