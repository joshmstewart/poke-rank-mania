
import React from "react";
import { Pokemon } from "@/services/pokemon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizePokedexNumber } from "@/utils/pokemon";

interface PokemonInfoModalProps {
  pokemon: Pokemon;
  children?: React.ReactNode;
}

const PokemonInfoModal: React.FC<PokemonInfoModalProps> = ({
  pokemon,
  children
}) => {
  const normalizedId = normalizePokedexNumber(pokemon.id);
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`ℹ️ Info button clicked for ${pokemon.name}`);
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 w-6 h-6 p-0 opacity-70 hover:opacity-100 z-10"
            onClick={handleInfoClick}
          >
            <Info className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src={pokemon.image} 
              alt={pokemon.name}
              className="w-8 h-8 object-contain"
            />
            {pokemon.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Pokédex #:</span>
              <div className="font-mono">#{normalizedId}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Generation:</span>
              <div>{pokemon.generation || "Unknown"}</div>
            </div>
          </div>

          {/* Types */}
          {pokemon.types && pokemon.types.length > 0 && (
            <div>
              <span className="text-muted-foreground text-sm">Types:</span>
              <div className="flex gap-1 mt-1">
                {pokemon.types.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Physical Attributes */}
          {(pokemon.height || pokemon.weight) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {pokemon.height && (
                <div>
                  <span className="text-muted-foreground">Height:</span>
                  <div>{(pokemon.height / 10).toFixed(1)} m</div>
                </div>
              )}
              {pokemon.weight && (
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <div>{(pokemon.weight / 10).toFixed(1)} kg</div>
                </div>
              )}
            </div>
          )}

          {/* Base Stats */}
          {pokemon.stats && Object.keys(pokemon.stats).length > 0 && (
            <div>
              <span className="text-muted-foreground text-sm">Base Stats:</span>
              <div className="mt-2 space-y-2">
                {Object.entries(pokemon.stats).map(([stat, value]) => (
                  <div key={stat} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-16 capitalize">
                      {stat.replace('-', ' ')}:
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((value / 255) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-8 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flavor Text */}
          {pokemon.flavorText && (
            <div>
              <span className="text-muted-foreground text-sm">Description:</span>
              <p className="text-sm mt-1 leading-relaxed">{pokemon.flavorText}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PokemonInfoModal;
