
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  return (
    <div 
      className={`cursor-pointer ${isSelected ? "ring-4 ring-primary" : ""}`}
      onClick={() => onSelect(pokemon.id)}
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
          
          {battleType === "pairs" ? (
            <RadioGroup 
              value={isSelected ? pokemon.id.toString() : ""} 
              className="mt-4"
              onValueChange={() => onSelect(pokemon.id)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={pokemon.id.toString()} id={`radio-${pokemon.id}`} />
                <label htmlFor={`radio-${pokemon.id}`}>Select</label>
              </div>
            </RadioGroup>
          ) : (
            <Button
              variant={isSelected ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(pokemon.id);
              }}
              className="mt-4"
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BattleCard;
