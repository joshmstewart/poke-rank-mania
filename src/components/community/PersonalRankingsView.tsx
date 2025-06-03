
import React from 'react';
import { RankingUI } from '../ranking/RankingUI';
import { usePokemonRanker } from '@/hooks/usePokemonRanker';
import { useGenerationState } from '@/hooks/battle/useGenerationState';

export const PersonalRankingsView: React.FC = () => {
  const { selectedGeneration, setSelectedGeneration } = useGenerationState();
  
  const {
    isLoading,
    availablePokemon,
    rankedPokemon,
    setAvailablePokemon,
    setRankedPokemon,
    loadingType,
    loadSize,
    currentPage,
    totalPages,
    loadingRef,
    handlePageChange,
    getPageRange,
    resetRankings
  } = usePokemonRanker();

  const handleGenerationChange = (gen: number) => {
    setSelectedGeneration(gen);
  };

  const handleReset = () => {
    resetRankings();
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Your Personal Rankings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Drag Pokémon from the available list to your rankings to trigger battles and determine their position.
        </p>
      </div>
      
      <div className="h-full">
        <RankingUI
          isLoading={isLoading}
          availablePokemon={availablePokemon}
          rankedPokemon={rankedPokemon}
          selectedGeneration={selectedGeneration}
          loadingType={loadingType}
          currentPage={currentPage}
          totalPages={totalPages}
          loadSize={loadSize}
          loadingRef={loadingRef}
          setAvailablePokemon={setAvailablePokemon}
          setRankedPokemon={setRankedPokemon}
          handlePageChange={handlePageChange}
          getPageRange={getPageRange}
          onGenerationChange={handleGenerationChange}
          onReset={handleReset}
        />
      </div>
    </div>
  );
};
