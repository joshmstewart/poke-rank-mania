
import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { MousePointerClick } from "lucide-react";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: "pairs" | "triplets";
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

// Use memo to prevent unnecessary re-renders
const BattleCard: React.FC<BattleCardProps> = memo(({
  pokemon,
  isSelected,
  battleType,
  onSelect,
  isProcessing = false
}) => {
  // Create a direct click handler that prevents event bubbling
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Skip if processing
    if (isProcessing) {
      console.log(`BattleCard: Click ignored for ${pokemon.name} because processing is in progress`);
      return;
    }
    
    console.log(`BattleCard: Clicked Pokemon: ${pokemon.id}, ${pokemon.name}`);
    onSelect(pokemon.id);
  };

  // Determine card styling based on selection and processing state
  const cardStyles = `
    cursor-pointer 
    h-full 
    transform 
    transition-all 
    ${isSelected ? "ring-4 ring-primary" : ""} 
    ${isProcessing ? "opacity-80 pointer-events-none" : "hover:scale-105"}
  `;

  return (
    <Card 
      className={cardStyles}
      onClick={handleCardClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      aria-disabled={isProcessing}
    >
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <img 
            src={pokemon.image} 
            alt={pokemon.name} 
            className="w-32 h-32 object-contain mb-4" 
            loading="eager"
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
          
          {/* Status indicator */}
          <div className="mt-4 px-3 py-2 bg-gray-100 rounded flex items-center justify-center w-full">
            {isProcessing ? (
              <div className="text-sm flex items-center gap-1 text-gray-400">
                <MousePointerClick size={16} className="animate-pulse" />
                Processing...
              </div>
            ) : battleType === "pairs" ? (
              <div className="text-sm flex items-center gap-1 text-primary">
                <MousePointerClick size={16} />
                Click to select
              </div>
            ) : (
              <div className={`text-sm ${isSelected ? "font-bold text-primary" : ""}`}>
                {isSelected ? "Selected" : "Click to select"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BattleCard.displayName = "BattleCard";

export default BattleCard;
