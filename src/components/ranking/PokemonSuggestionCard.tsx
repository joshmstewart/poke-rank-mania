
import React, { useState, useEffect } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import { RankedPokemon } from "@/services/pokemon";
import { ArrowUp, ArrowDown } from "lucide-react";
import { getPokemonGeneration } from "./rankingUtils";
import { normalizePokedexNumber, capitalizeSpecialForms } from "@/utils/pokemonUtils";

interface PokemonSuggestionCardProps {
  pokemon: RankedPokemon;
  children: React.ReactNode;
  onSuggestRanking: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion: (pokemonId: number) => void;
}

export const PokemonSuggestionCard: React.FC<PokemonSuggestionCardProps> = ({
  pokemon,
  children,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  const [activeDirection, setActiveDirection] = useState<"up" | "down" | null>(
    pokemon.suggestedAdjustment?.direction || null
  );
  const [activeStrength, setActiveStrength] = useState<1 | 2 | 3>(
    pokemon.suggestedAdjustment?.strength || 1
  );

  // CRITICAL FIX: Sync internal state when pokemon.suggestedAdjustment changes
  useEffect(() => {
    if (pokemon.suggestedAdjustment) {
      setActiveDirection(pokemon.suggestedAdjustment.direction);
      setActiveStrength(pokemon.suggestedAdjustment.strength);
      console.log(`📌 Syncing suggestion card state for ${pokemon.name}: ${pokemon.suggestedAdjustment.direction} ${pokemon.suggestedAdjustment.strength}`);
    } else {
      setActiveDirection(null);
      setActiveStrength(1);
    }
  }, [
    pokemon.suggestedAdjustment, 
    pokemon.name, 
    pokemon.id
  ]);

  const generation = getPokemonGeneration(pokemon.id);
  
  // Normalize the pokemon ID for display
  const normalizedId = normalizePokedexNumber(pokemon.id);
  
  // Capitalize special forms in the name
  const formattedName = capitalizeSpecialForms(pokemon.name);
  
  const handleDirectionChange = (direction: "up" | "down") => {
    // If same direction is clicked, remove the suggestion
    if (direction === activeDirection) {
      setActiveDirection(null);
      setActiveStrength(1);
      onRemoveSuggestion(pokemon.id);
    } else {
      setActiveDirection(direction);
      onSuggestRanking(pokemon, direction, activeStrength);
    }
  };
  
  const handleStrengthChange = (value: string) => {
    if (!activeDirection) return;
    
    const strength = parseInt(value) as 1 | 2 | 3;
    setActiveStrength(strength);
    onSuggestRanking(pokemon, activeDirection, strength);
  };
  
  return (
    <HoverCard openDelay={0} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div className="relative cursor-pointer">
          {children}
          {pokemon.suggestedAdjustment && !pokemon.suggestedAdjustment.used && (
            <div 
              className={`absolute -top-2 -right-2 px-1 rounded text-xs font-bold
                ${pokemon.suggestedAdjustment.direction === "up" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
                }`}
            >
              {pokemon.suggestedAdjustment.direction === "up" 
                ? "↑".repeat(pokemon.suggestedAdjustment.strength)
                : "↓".repeat(pokemon.suggestedAdjustment.strength)
              }
            </div>
          )}
          
          {pokemon.suggestedAdjustment?.used && (
            <div className="absolute -top-2 -right-2 px-1 rounded bg-gray-100 text-gray-500 text-xs font-bold">
              ✓
            </div>
          )}
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-72" align="end">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={pokemon.image} 
              alt={formattedName}
              className="w-12 h-12 object-contain"
            />
            <div>
              <h4 className="font-semibold">{formattedName}</h4>
              <div className="text-xs text-muted-foreground">
                #{normalizedId} • {generation?.name || "Unknown"}
              </div>
              {pokemon.types && (
                <div className="flex gap-1 mt-1">
                  {pokemon.types.map(type => (
                    <span 
                      key={type} 
                      className="text-xs px-1.5 py-0.5 rounded bg-gray-100"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid gap-1.5">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Rating:</span>
                <span className="font-mono">{pokemon.score?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span>{pokemon.confidence?.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Battles:</span>
                <span>{pokemon.count}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-2">
            <div className="text-xs font-medium mb-1">Suggest ranking adjustment:</div>
            <div className="flex gap-2">
              <ToggleGroup 
                type="single" 
                className="justify-start"
                value={activeDirection || ""}
              >
                <ToggleGroupItem 
                  value="up" 
                  aria-label="Should rank higher"
                  onClick={() => handleDirectionChange("up")}
                  className={`${activeDirection === "up" ? "bg-green-100" : ""}`}
                >
                  <ArrowUp className="h-4 w-4" />
                </ToggleGroupItem>
                
                <ToggleGroupItem
                  value="down"
                  aria-label="Should rank lower"
                  onClick={() => handleDirectionChange("down")}
                  className={`${activeDirection === "down" ? "bg-red-100" : ""}`}
                >
                  <ArrowDown className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              
              {activeDirection && (
                <ToggleGroup
                  type="single"
                  value={activeStrength.toString()}
                  onValueChange={handleStrengthChange}
                >
                  <ToggleGroupItem value="1">
                    {activeDirection === "up" ? "↑" : "↓"}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="2">
                    {activeDirection === "up" ? "↑↑" : "↓↓"}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="3">
                    {activeDirection === "up" ? "↑↑↑" : "↓↓↓"}
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </div>
            
            {activeDirection && (
              <p className="text-xs text-muted-foreground mt-1.5">
                This will suggest {formattedName} should be ranked 
                <span className="font-medium"> {activeDirection === "up" ? "higher" : "lower"}</span> in the next battle.
              </p>
            )}
            
            {pokemon.suggestedAdjustment?.used && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">
                This suggestion has already been used in battle.
              </p>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
