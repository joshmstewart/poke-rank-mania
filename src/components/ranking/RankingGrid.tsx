
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { VotingArrows } from "./VotingArrows";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import { formatPokemonName } from "@/utils/pokemon";

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
        const showRankNumber = onSuggestRanking !== undefined; // Only show rank number in rankings section

        // CRITICAL FIX: Apply proper name formatting here
        const formattedPokemon = {
          ...pokemon,
          name: formatPokemonName(pokemon.name)
        };

        return (
          <div key={pokemon.id} className="relative group">
            {/* Voting arrows for ranked Pokemon */}
            {isRankedPokemon && onSuggestRanking && onRemoveSuggestion && (
              <VotingArrows
                pokemon={formattedPokemon as RankedPokemon}
                onSuggestRanking={onSuggestRanking}
                onRemoveSuggestion={onRemoveSuggestion}
              />
            )}

            {/* Using draggable card component with formatted Pokemon */}
            <DraggablePokemonMilestoneCard
              pokemon={formattedPokemon}
              index={index}
              isPending={false}
              showRank={showRankNumber}
              isDraggable={false}
              isAvailable={false}
              context="ranked"
            />
          </div>
        );
      })}
    </div>
  );
};
