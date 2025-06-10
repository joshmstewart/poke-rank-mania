import React, { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { usePokemonContext } from "@/contexts/PokemonContext";

interface EnhancedAvailablePokemonContentProps {
  enhancedAvailablePokemon: Pokemon[];
  isLoading: boolean;
  selectedGeneration: number;
  loadingType: string;
}

const EnhancedAvailablePokemonContent: React.FC<EnhancedAvailablePokemonContentProps> = ({
  enhancedAvailablePokemon,
  isLoading,
  selectedGeneration,
  loadingType
}) => {
  const [localSearch, setLocalSearch] = useState("");
  
  // Get all available Pokemon for star functionality context
  const { allPokemon } = usePokemonContext();
  
  const filteredPokemon = enhancedAvailablePokemon.filter(pokemon =>
    pokemon.name.toLowerCase().includes(localSearch.toLowerCase())
  );

  if (isLoading && enhancedAvailablePokemon.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Generation {selectedGeneration} Pokémon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <input
          type="text"
          placeholder="Search available Pokémon..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Pokemon Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {filteredPokemon.map((pokemon, index) => (
            <DraggablePokemonMilestoneCard
              key={`available-${pokemon.id}`}
              pokemon={pokemon}
              index={index}
              isPending={false}
              showRank={false}
              isDraggable={true}
              isAvailable={true}
              context="available"
              allRankedPokemon={allPokemon}
            />
          ))}
        </div>

        {filteredPokemon.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            {localSearch ? "No Pokémon match your search." : "No available Pokémon found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAvailablePokemonContent;
