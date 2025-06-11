
import React from "react";
import { RankedPokemon } from "@/services/pokemon";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { VotingArrows } from "./VotingArrows";
import { Star } from "lucide-react";
import { useCloudPendingBattles } from "@/hooks/battle/useCloudPendingBattles";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { usePokemonContext } from "@/contexts/PokemonContext";

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
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Use cloud pending battles and Zustand store for queue operations
  const { isPokemonPending, addPendingPokemon, removePendingPokemon } = useCloudPendingBattles();
  const { queueBattlesForReorder } = useTrueSkillStore();
  const { allPokemon } = usePokemonContext();
  
  const isPendingRefinement = isPokemonPending(pokemon.id);

  const handlePrioritizeClick = (e: React.MouseEvent) => {
    // CRITICAL: This MUST be the first line to prevent event bubbling
    e.stopPropagation();
    e.preventDefault();

    console.log(`⭐ [MANUAL_MODE_STAR_TOGGLE] Star clicked for ${pokemon.name} - current pending: ${isPendingRefinement}`);

    if (!isPendingRefinement) {
      console.log(`⭐ [MANUAL_MODE_STAR_TOGGLE] Adding ${pokemon.name} to CLOUD pending state`);
      addPendingPokemon(pokemon.id);

      if (allPokemon.length > 1) {
        const pool = allPokemon.filter(p => p.id !== pokemon.id);
        const opponents: number[] = [];
        const copy = [...pool];
        while (opponents.length < 3 && copy.length > 0) {
          const rand = Math.floor(Math.random() * copy.length);
          opponents.push(copy.splice(rand, 1)[0].id);
        }
        try {
          queueBattlesForReorder(pokemon.id, opponents, -1);
        } catch (error) {
          console.error('Failed to queue refinement battles from manual mode card', error);
        }
      }
    } else {
      console.log(`⭐ [MANUAL_MODE_STAR_TOGGLE] Removing ${pokemon.name} from CLOUD pending state`);
      removePendingPokemon(pokemon.id);
    }
  };

  // If no suggestion handlers provided, just render the children with star functionality
  if (!onSuggestRanking || !onRemoveSuggestion) {
    return (
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
        
        {/* Prioritize button - only visible on card hover */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          onClick={handlePrioritizeClick}
          className={`absolute top-1/2 right-1 -translate-y-1/2 z-30 p-1 rounded-full transition-all duration-300 ${
            isPendingRefinement
              ? 'opacity-100'
              : isHovered
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
          }`}
          title={isPendingRefinement ? "Remove from refinement queue" : "Prioritize for refinement battle"}
          type="button"
        >
          <Star
            className={`w-6 h-6 transition-all duration-300 ${
              isPendingRefinement 
                ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] filter brightness-125' 
                : 'text-gray-500 hover:text-yellow-500'
            }`}
            fill={isPendingRefinement ? "url(#manualStarGradient)" : "none"}
          />
          {/* SVG gradient definition for shiny star effect */}
          {isPendingRefinement && (
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="manualStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="25%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="75%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div 
          className="relative cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {children}
          
          {/* Prioritize button - only visible on card hover */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
            }}
            onClick={handlePrioritizeClick}
            className={`absolute top-1/2 right-1 -translate-y-1/2 z-30 p-1 rounded-full transition-all duration-300 ${
              isPendingRefinement
                ? 'opacity-100'
                : isHovered
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
            }`}
            title={isPendingRefinement ? "Remove from refinement queue" : "Prioritize for refinement battle"}
            type="button"
          >
            <Star
              className={`w-6 h-6 transition-all duration-300 ${
                isPendingRefinement 
                  ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] filter brightness-125' 
                  : 'text-gray-500 hover:text-yellow-500'
              }`}
              fill={isPendingRefinement ? "url(#manualStarGradient)" : "none"}
            />
            {/* SVG gradient definition for shiny star effect */}
            {isPendingRefinement && (
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="manualStarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="25%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="75%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </button>
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
