import { usePokemonGroupingMemo } from "@/hooks/pokemon/usePokemonGroupingMemo";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import EnhancedAvailablePokemonContent from "./EnhancedAvailablePokemonContent";
import React from 'react';

interface EnhancedAvailablePokemonSectionProps {
  availablePokemon: Pokemon[];
  rankedPokemon: (Pokemon | RankedPokemon)[];
}

const EnhancedAvailablePokemonSection: React.FC<EnhancedAvailablePokemonSectionProps> = ({
  availablePokemon,
  rankedPokemon,
}) => {
  // CORRECTED: Call the hook at the top level of the component.
  const { items: groupedAvailablePokemon, showHeaders } = usePokemonGroupingMemo(
    availablePokemon,
    rankedPokemon.map(p => p.id)
  );

  return (
    <div className="h-full flex flex-col">
      <EnhancedAvailablePokemonContent
        groupedPokemon={groupedAvailablePokemon}
        showHeaders={showHeaders}
      />
    </div>
  );
};

export default React.memo(EnhancedAvailablePokemonSection);