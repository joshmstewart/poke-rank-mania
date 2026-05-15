
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { TCGCard } from "@/hooks/pokemon/tcg/types";
import PokemonTCGCardDisplay from "./PokemonTCGCardDisplay";
import PokemonBasicInfo from "./PokemonBasicInfo";
import PokemonStats from "./PokemonStats";
import PokemonDescription from "./PokemonDescription";
import { Badge } from "@/components/ui/badge";
import { getGenerationName } from "@/utils/pokemon/pokemonGenerationUtils";
import { normalizePokedexNumber } from "@/utils/pokemon";

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
    return (
      <div className="space-y-4">
        <PokemonMetaHeader pokemon={pokemon} />
        <PokemonTCGCardDisplay tcgCard={tcgCard} secondCard={secondTcgCard} />
      </div>
    );
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

const PokemonMetaHeader: React.FC<{ pokemon: Pokemon }> = ({ pokemon }) => {
  const formattedId = `#${normalizePokedexNumber(pokemon.id)}`;
  const generation = getGenerationName(pokemon.id);
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground p-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <MetaRow label="No." value={formattedId} />
        {pokemon.height ? (
          <MetaRow label="Height" value={`${(pokemon.height / 10).toFixed(1)} m`} />
        ) : null}
        {pokemon.weight ? (
          <MetaRow label="Weight" value={`${(pokemon.weight / 10).toFixed(1)} kg`} />
        ) : null}
        <MetaRow label="Generation" value={generation} />
      </div>
      {pokemon.types && pokemon.types.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          {pokemon.types.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const MetaRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);
