
import React, { useState, useEffect } from "react";
import { RankedPokemon } from "@/services/pokemon";
import { ArrowUp, ArrowDown } from "lucide-react";

interface VotingArrowsProps {
  pokemon: RankedPokemon;
  onSuggestRanking: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion: (pokemonId: number) => void;
}

export const VotingArrows: React.FC<VotingArrowsProps> = ({
  pokemon,
  onSuggestRanking,
  onRemoveSuggestion
}) => {
  // Get current active direction and strength from pokemon's suggestion
  const [activeDirection, setActiveDirection] = useState<"up" | "down" | null>(
    pokemon.suggestedAdjustment?.direction || null
  );
  const [activeStrength, setActiveStrength] = useState<1 | 2 | 3>(
    pokemon.suggestedAdjustment?.strength || 1
  );
  
  // Update local state when pokemon's suggestion changes
  useEffect(() => {
    setActiveDirection(pokemon.suggestedAdjustment?.direction || null);
    setActiveStrength(pokemon.suggestedAdjustment?.strength || 1);
  }, [pokemon.suggestedAdjustment]);

  // Handle vote button click
  const handleVote = (direction: "up" | "down", strength: 1 | 2 | 3) => {
    // If same direction and strength, remove vote
    if (direction === activeDirection && strength === activeStrength) {
      setActiveDirection(null);
      setActiveStrength(1);
      onRemoveSuggestion(pokemon.id);
    } else {
      // Otherwise, set new vote
      setActiveDirection(direction);
      setActiveStrength(strength);
      onSuggestRanking(pokemon, direction, strength);
    }
  };

  // Generate arrow button for each vote option
  const renderArrow = (direction: "up" | "down", strength: 1 | 2 | 3) => {
    const isActive = activeDirection === direction && activeStrength === strength;
    const isUpvote = direction === "up";
    
    // Base styles
    let baseClasses = `flex items-center justify-center py-2 w-full transition-colors
                       ${pokemon.suggestedAdjustment?.used ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`;
    
    // Direction-specific styles
    const directionClasses = isUpvote
      ? `${isActive ? "bg-green-500 text-white" : "hover:bg-green-100"}`
      : `${isActive ? "bg-red-500 text-white" : "hover:bg-red-100"}`;
    
    // Arrow icons based on direction and strength
    const ArrowIcon = isUpvote ? ArrowUp : ArrowDown;
    const arrows = [];
    for (let i = 0; i < strength; i++) {
      arrows.push(<ArrowIcon key={i} className="h-3 w-3" />);
    }
    
    return (
      <button
        className={`${baseClasses} ${directionClasses}`}
        onClick={() => !pokemon.suggestedAdjustment?.used && handleVote(direction, strength)}
        disabled={pokemon.suggestedAdjustment?.used}
        title={`Vote ${isUpvote ? "up" : "down"} ${strength}${pokemon.suggestedAdjustment?.used ? " (Already used)" : ""}`}
      >
        <div className="flex items-center gap-1">
          {arrows}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full absolute inset-0 bg-white bg-opacity-90 z-10">
      {/* Up vote arrows (strongest to weakest) */}
      {renderArrow("up", 3)}
      {renderArrow("up", 2)}
      {renderArrow("up", 1)}
      
      {/* Down vote arrows (weakest to strongest) */}
      {renderArrow("down", 1)}
      {renderArrow("down", 2)}
      {renderArrow("down", 3)}
    </div>
  );
};
