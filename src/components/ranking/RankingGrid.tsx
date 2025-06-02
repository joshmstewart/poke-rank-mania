
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { VotingArrows } from "./VotingArrows";
import { UnifiedPokemonCard } from "./UnifiedPokemonCard";

interface RankingGridProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  activeTier?: any;
  isMilestoneView?: boolean;
  battlesCompleted?: number;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

export const RankingGrid: React.FC<RankingGridProps> = ({
  displayRankings,
  activeTier,
  isMilestoneView = false,
  battlesCompleted = 0,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {displayRankings.map((pokemon, index) => {
        const isRankedPokemon = 'score' in pokemon;

        return (
          <div key={pokemon.id} className="relative group">
            {/* Voting arrows for ranked Pokemon */}
            {isRankedPokemon && onSuggestRanking && onRemoveSuggestion && (
              <VotingArrows
                pokemon={pokemon as RankedPokemon}
                onSuggestRanking={onSuggestRanking}
                onRemoveSuggestion={onRemoveSuggestion}
              />
            )}

            {/* Using unified card component */}
            <UnifiedPokemonCard
              pokemon={pokemon}
              rank={index + 1}
              showRank={true}
              showScore={true}
            />
          </div>
        );
      })}
    </div>
  );
};
