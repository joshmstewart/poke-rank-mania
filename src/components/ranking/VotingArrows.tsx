import React, { useState, useEffect } from "react";
import { RankedPokemon } from "@/services/pokemon";

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
    let baseClasses = `flex items-center justify-center w-8 h-8 transition-colors rounded-full 
                      ${pokemon.suggestedAdjustment?.used ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-opacity-90"}`;
    
    // Direction-specific styles
    const directionClasses = isUpvote
      ? `${isActive ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-green-100"}`
      : `${isActive ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-red-100"}`;
    
    // Arrow characters based on direction and strength
    const arrowChar = isUpvote ? "↑" : "↓";
    const arrowSymbol = arrowChar.repeat(strength);
    
    return (
      <button
        className={`${baseClasses} ${directionClasses}`}
        onClick={() => !pokemon.suggestedAdjustment?.used && handleVote(direction, strength)}
        disabled={pokemon.suggestedAdjustment?.used}
        title={`Vote ${isUpvote ? "up" : "down"} ${strength}${pokemon.suggestedAdjustment?.used ? " (Already used)" : ""}`}
      >
        {arrowSymbol}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1 p-1 bg-white border border-gray-200 rounded-l-lg shadow-md">
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
