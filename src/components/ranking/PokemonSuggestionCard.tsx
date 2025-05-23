
import React from "react";
import { RankedPokemon } from "@/services/pokemon";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { VotingArrows } from "./VotingArrows";

interface PokemonSuggestionCardProps {
  pokemon: RankedPokemon;
  children: React.ReactNode;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

export const PokemonSuggestionCard: React.FC<PokemonSuggestionCardProps> = ({
  pokemon,
  children,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  // If no suggestion handlers provided, just render the children
  if (!onSuggestRanking || !onRemoveSuggestion) {
    return <>{children}</>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="relative cursor-pointer">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">{pokemon.name}</h4>
            <span className="text-sm text-muted-foreground">#{pokemon.id}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-1 gap-y-1 text-sm">
            <div className="text-muted-foreground">Rating:</div>
            <div className="text-right font-mono">{pokemon.score?.toFixed(1) || "N/A"}</div>
            
            <div className="text-muted-foreground">Confidence:</div>
            <div className="text-right">{pokemon.confidence?.toFixed(0)}%</div>
            
            <div className="text-muted-foreground">Battles:</div>
            <div className="text-right">{pokemon.count || 0}</div>
            
            {pokemon.suggestedAdjustment && (
              <>
                <div className="text-muted-foreground">Suggestion:</div>
                <div className="text-right">
                  {pokemon.suggestedAdjustment.direction === "up" ? "↑" : "↓"}
                  {pokemon.suggestedAdjustment.strength}
                  {pokemon.suggestedAdjustment.used ? " (Used)" : ""}
                </div>
              </>
            )}
          </div>
          
          <div className="border-t pt-2">
            <p className="text-sm font-medium mb-2">Suggest ranking adjustment:</p>
            <div className="flex justify-center">
              <VotingArrows 
                pokemon={pokemon}
                onSuggestRanking={onSuggestRanking}
                onRemoveSuggestion={onRemoveSuggestion}
              />
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
