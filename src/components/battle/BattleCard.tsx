
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemonService";
import { MousePointerClick } from "lucide-react";

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
  // Create a direct click handler without useCallback to avoid stale closures
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent default and stop propagation to avoid double clicks
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`BattleCard clicked: ${pokemon.id}, ${pokemon.name}`);
    
    // Pass the ID directly to the onSelect function
    onSelect(pokemon.id);
  };

  return (
    <Card 
      className={`cursor-pointer h-full transform transition-all hover:scale-105 ${
        isSelected ? "ring-4 ring-primary" : ""
      }`}
      onClick={handleCardClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
    >
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-full flex flex-col items-center justify-center">
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
          
          {/* Show click indicator for pairs mode */}
          {battleType === "pairs" ? (
            <div className="mt-4 px-3 py-2 bg-gray-100 rounded flex items-center justify-center w-full">
              <div className="text-sm flex items-center gap-1">
                <MousePointerClick size={16} />
                Click to select
              </div>
            </div>
          ) : (
            /* Only show selection indicator for triplets mode */
            <div className="mt-4 px-3 py-2 bg-gray-100 rounded flex items-center justify-center w-full">
              <div className={`text-sm ${isSelected ? "font-bold text-primary" : ""}`}>
                {isSelected ? "Selected" : "Click to select"}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BattleCard;
