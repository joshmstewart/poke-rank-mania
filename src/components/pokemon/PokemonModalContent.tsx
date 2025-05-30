
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { TCGCard } from "@/hooks/pokemon/tcg/types";
import PokemonTCGCardDisplay from "./PokemonTCGCardDisplay";
import PokemonBasicInfo from "./PokemonBasicInfo";
import PokemonStats from "./PokemonStats";
import PokemonDescription from "./PokemonDescription";

interface PokemonModalContentProps {
  pokemon: Pokemon;
  showLoading: boolean;
  showTCGCards: boolean;
  showFallbackInfo: boolean;
  tcgCard: TCGCard | null;
  secondTcgCard: TCGCard | null;
  flavorText: string;
  isLoadingFlavor: boolean;
}

const PokemonModalContent: React.FC<PokemonModalContentProps> = ({
  pokemon,
  showTCGCards,
  showFallbackInfo,
  tcgCard,
  secondTcgCard,
  flavorText,
  isLoadingFlavor
}) => {
  if (showTCGCards && tcgCard) {
    return <PokemonTCGCardDisplay tcgCard={tcgCard} secondCard={secondTcgCard} />;
  }

  if (showFallbackInfo) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side - Pokemon image and basic info */}
        <PokemonBasicInfo pokemon={pokemon} />

        {/* Right side - Stats and description */}
        <div className="space-y-4">
          <PokemonStats pokemon={pokemon} />
          <PokemonDescription flavorText={flavorText} isLoadingFlavor={isLoadingFlavor} />
        </div>
      </div>
    );
  }

  return null;
};

export default PokemonModalContent;
