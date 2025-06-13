
import { usePokemonGroupingMemo } from "@/hooks/pokemon/usePokemonGroupingMemo";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { EnhancedAvailablePokemonContent } from "./EnhancedAvailablePokemonContent";
import React from 'react';

interface EnhancedAvailablePokemonSectionProps {
  availablePokemon: Pokemon[];
  rankedPokemon: (Pokemon | RankedPokemon)[];
}

const EnhancedAvailablePokemonSection: React.FC<EnhancedAvailablePokemonSectionProps> = ({
  availablePokemon,
  rankedPokemon,
}) => {
  // Call the hook with the correct parameters
  const { items: groupedAvailablePokemon, showGenerationHeaders } = usePokemonGroupingMemo({
    pokemon: availablePokemon,
    searchTerm: "",
    isRankingArea: false,
    isGenerationExpanded: () => true
  });

  return (
    <div className="h-full flex flex-col">
      <EnhancedAvailablePokemonContent
        items={groupedAvailablePokemon}
        showGenerationHeaders={showGenerationHeaders}
        viewMode="grid"
        isGenerationExpanded={() => true}
        onToggleGeneration={() => {}}
        isLoading={false}
        loadingRef={React.createRef()}
        currentPage={1}
        totalPages={1}
        allRankedPokemon={rankedPokemon}
      />
    </div>
  );
};

export default React.memo(EnhancedAvailablePokemonSection);
