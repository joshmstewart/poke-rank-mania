
import React, { useState, useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { getPokemonTypeColor } from "./utils/pokemonTypeColors";
import { getPreferredImageUrl } from "@/components/settings/ImagePreferenceSelector";
import { normalizePokedexNumber, capitalizeSpecialForms } from "@/utils/pokemonUtils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getPokemonGeneration } from "@/components/ranking/rankingUtils";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PokemonThumbnailProps {
  pokemon: Pokemon;
  index: number;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
}

const PokemonThumbnail: React.FC<PokemonThumbnailProps> = ({ 
  pokemon, 
  index, 
  onSuggestRanking, 
  onRemoveSuggestion 
}) => {
  const typeColor = getPokemonTypeColor(pokemon);
  const normalizedId = normalizePokedexNumber(pokemon.id);
  const formattedName = capitalizeSpecialForms(pokemon.name);
  const generation = getPokemonGeneration(pokemon.id);
  const [imageSrc, setImageSrc] = useState(getPreferredImageUrl(pokemon.id));
  
  // Check if the pokemon has ranking properties (is a RankedPokemon)
  const isRankedPokemon = (pokemon: Pokemon): pokemon is RankedPokemon => {
    return 'score' in pokemon && 'count' in pokemon;
  };
  
  const rankedPokemon = isRankedPokemon(pokemon) ? pokemon : undefined;
  
  // State for the suggestion UI
  const [activeDirection, setActiveDirection] = useState<"up" | "down" | null>(
    rankedPokemon?.suggestedAdjustment?.direction || null
  );
  const [activeStrength, setActiveStrength] = useState<1 | 2 | 3>(
    rankedPokemon?.suggestedAdjustment?.strength || 1
  );
  
  // Load image on component mount and if Pokemon changes
  useEffect(() => {
    const preferredUrl = getPreferredImageUrl(pokemon.id);
    console.log(`🖼️ PokemonThumbnail: Loading image for ${pokemon.name} from: ${preferredUrl}`);
    setImageSrc(preferredUrl);
  }, [pokemon.id, pokemon.name]);
  
  // Handle image load errors
  const handleImageError = () => {
    console.log(`❌ Image failed to load for ${pokemon.name}, trying fallback`);
    // Try a fallback
    const fallbackUrl = getPreferredImageUrl(pokemon.id, 1); // Explicit fallback index
    console.log(`🖼️ Using fallback URL: ${fallbackUrl}`);
    setImageSrc(fallbackUrl);
  };
  
  // Handle direction change (up/down arrows)
  const handleDirectionChange = (direction: "up" | "down") => {
    if (!rankedPokemon || !onSuggestRanking || !onRemoveSuggestion) return;
    
    // If same direction is clicked, remove the suggestion
    if (direction === activeDirection) {
      setActiveDirection(null);
      setActiveStrength(1);
      onRemoveSuggestion(rankedPokemon.id);
    } else {
      setActiveDirection(direction);
      onSuggestRanking(rankedPokemon, direction, activeStrength);
    }
  };
  
  // Handle strength change (1/2/3 arrows)
  const handleStrengthChange = (value: string) => {
    if (!activeDirection || !rankedPokemon || !onSuggestRanking) return;
    
    const strength = parseInt(value) as 1 | 2 | 3;
    setActiveStrength(strength);
    onSuggestRanking(rankedPokemon, activeDirection, strength);
  };
  
  return (
    <HoverCard openDelay={0} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div className="relative flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          {/* Rank number with type-colored background */}
          <div className={`absolute top-2 left-2 z-10 ${typeColor} text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
            <span className="text-sm font-bold">{index + 1}</span>
          </div>
          
          {/* Show suggestion indicator if this pokemon has a suggestion */}
          {rankedPokemon?.suggestedAdjustment && !rankedPokemon.suggestedAdjustment.used && (
            <div 
              className={`absolute -top-2 -right-2 px-1 rounded text-xs font-bold
                ${rankedPokemon.suggestedAdjustment.direction === "up" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
                }`}
            >
              {rankedPokemon.suggestedAdjustment.direction === "up" 
                ? "↑".repeat(rankedPokemon.suggestedAdjustment.strength)
                : "↓".repeat(rankedPokemon.suggestedAdjustment.strength)
              }
            </div>
          )}
          
          {/* Show checkmark if suggestion was used */}
          {rankedPokemon?.suggestedAdjustment?.used && (
            <div className="absolute -top-2 -right-2 px-1 rounded bg-gray-100 text-gray-500 text-xs font-bold">
              ✓
            </div>
          )}
          
          {/* Pokemon image in center - more compact */}
          <div className={`p-1 flex items-center justify-center ${typeColor} bg-opacity-20`}>
            <div className="w-full aspect-square relative flex items-center justify-center max-h-20">
              <img 
                src={imageSrc} 
                alt={formattedName} 
                className="object-contain max-h-16 p-1"
                onLoad={() => console.log(`🖼️ Image loaded for Pokemon: ${pokemon.name} (${imageSrc})`)}
                onError={handleImageError}
              />
            </div>
          </div>
          
          {/* Pokemon info at bottom */}
          <div className="py-1 px-2 text-center border-t border-gray-100">
            <div className="font-medium text-xs truncate">{formattedName}</div>
            <div className="text-xs text-muted-foreground">#{normalizedId}</div>
          </div>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-64" align="center">
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
              {rankedPokemon && (
                <>
                  <div className="flex justify-between">
                    <span>Battles:</span>
                    <span>{rankedPokemon.count || "N/A"}</span>
                  </div>
                  {rankedPokemon.score !== undefined && (
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <span className="font-mono">{rankedPokemon.score.toFixed(1)}</span>
                    </div>
                  )}
                  {rankedPokemon.confidence !== undefined && (
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span>{rankedPokemon.confidence.toFixed(0)}%</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Only show voting UI if we have the callback props */}
          {onSuggestRanking && onRemoveSuggestion && rankedPokemon && (
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
              
              {rankedPokemon.suggestedAdjustment?.used && (
                <p className="text-xs text-muted-foreground mt-1.5 italic">
                  This suggestion has already been used in battle.
                </p>
              )}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default PokemonThumbnail;
