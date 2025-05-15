
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemonService";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: "pairs" | "triplets";
  onSelect: (id: number) => void;
}

const BattleCard: React.FC<BattleCardProps> = ({
  pokemon,
  isSelected,
  battleType,
  onSelect
}) => {
  const [isClicking, setIsClicking] = useState(false);

  // Improved click handler with better protection against multiple clicks
  const handleClick = () => {
    // If already processing a click, ignore subsequent clicks
    if (isClicking) return;
    
    // Set clicking state to prevent additional clicks
    setIsClicking(true);
    
    // Call the selection handler with the pokemon ID
    onSelect(pokemon.id);
    
    // Reset after a short delay - shorter for pairs mode for better responsiveness
    setTimeout(() => {
      setIsClicking(false);
    }, battleType === "pairs" ? 100 : 300);
  };

  // For keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      className={`cursor-pointer ${isSelected && battleType === "triplets" ? "ring-4 ring-primary" : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
    >
      <Card className="h-full transform transition-all hover:scale-105">
        <CardContent className="flex flex-col items-center justify-center p-4">
          <img 
            src={pokemon.image} 
            alt={pokemon.name} 
            className="w-32 h-32 object-contain mb-4" 
          />
          <h3 className="text-xl font-bold">{pokemon.name}</h3>
          <p className="text-gray-500">#{pokemon.id}</p>
          
          {pokemon.types && pokemon.types.length > 0 && (
            <div className="flex gap-2 mt-2">
              {pokemon.types.map((type, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs rounded-full bg-gray-100"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
          
          {/* Only show selection indicator for triplets mode */}
          {battleType === "triplets" && (
            <div className="mt-4 px-3 py-2 bg-gray-100 rounded flex items-center justify-center w-full">
              <div className={`text-sm ${isSelected ? "font-bold text-primary" : ""}`}>
                {isSelected ? "Selected" : "Click to select"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BattleCard;
