
import React, { useState } from 'react';
import { useGlobalRankings, GlobalRankedPokemon } from '@/hooks/useGlobalRankings';
import { useGenerationState } from '@/hooks/battle/useGenerationState';
import { LoadingState } from '../ranking/LoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DraggablePokemonMilestoneCard from '@/components/battle/DraggablePokemonMilestoneCard';

export const GlobalRankingsView: React.FC = () => {
  const { selectedGeneration, setSelectedGeneration } = useGenerationState();
  const [minUsers, setMinUsers] = useState(3);
  
  const { data: globalRankings, isLoading, error, meta } = useGlobalRankings({
    generation: selectedGeneration,
    minUsers,
    enabled: true
  });

  if (isLoading) {
    return (
      <LoadingState 
        selectedGeneration={selectedGeneration} 
        loadSize={100} 
        itemsPerPage={50}
        loadingType="single"
      />
    );
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertDescription>
          Error loading global rankings: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Convert global rankings to milestone card format
  const milestoneFormattedPokemon = globalRankings.map((pokemon, index) => ({
    id: pokemon.pokemonId,
    name: pokemon.name,
    image: pokemon.image,
    types: pokemon.types,
    generation: pokemon.generationId,
    globalRank: pokemon.globalRank,
    averageScore: pokemon.averageScore,
    usersRankedCount: pokemon.usersRankedCount
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label htmlFor="generation-select">Generation</Label>
            <Select value={selectedGeneration.toString()} onValueChange={(value) => setSelectedGeneration(Number(value))}>
              <SelectTrigger id="generation-select" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Gens</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => (
                  <SelectItem key={gen} value={gen.toString()}>Gen {gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="min-users-select">Min. Users</Label>
            <Select value={minUsers.toString()} onValueChange={(value) => setMinUsers(Number(value))}>
              <SelectTrigger id="min-users-select" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
                <SelectItem value="10">10+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {meta && (
            <div className="text-sm text-gray-600">
              Showing {meta.totalPokemon} Pokémon 
              {meta.generationFilter && ` from Generation ${meta.generationFilter}`}
              {` (min. ${meta.minUsersFilter} users)`}
            </div>
          )}
        </div>
      </div>

      {/* Global Rankings Grid - Using Milestone Style */}
      {milestoneFormattedPokemon.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No Pokémon meet the current criteria.</p>
          <p className="text-sm text-gray-500 mt-2">Try lowering the minimum users filter or selecting a different generation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Global Rankings ({milestoneFormattedPokemon.length} Pokémon)
            </h2>
          </div>
          
          <div className="p-6">
            {/* Milestone-style grid - exactly 5 columns like milestone view */}
            <div className="grid grid-cols-5 gap-4">
              {milestoneFormattedPokemon.map((pokemon, index) => (
                <div key={pokemon.id} className="relative">
                  <DraggablePokemonMilestoneCard
                    pokemon={pokemon}
                    index={pokemon.globalRank - 1} // Use global rank for display
                    isPending={false}
                    showRank={true}
                    isDraggable={false} // Global view is read-only
                    isAvailable={false}
                    context="ranked"
                  />
                  
                  {/* Additional global ranking info overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/75 text-white text-xs rounded px-2 py-1">
                    <div className="flex justify-between items-center">
                      <span>Avg: {pokemon.averageScore.toFixed(1)}</span>
                      <span>{pokemon.usersRankedCount} users</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
