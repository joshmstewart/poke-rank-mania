
import React, { useState } from "react";
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

const typeColors: Record<string, string> = {
  Normal: "bg-gray-400", Fire: "bg-red-500", Water: "bg-blue-500", Electric: "bg-yellow-400",
  Grass: "bg-green-500", Ice: "bg-blue-200", Fighting: "bg-red-700", Poison: "bg-purple-600",
  Ground: "bg-yellow-700", Flying: "bg-indigo-300", Psychic: "bg-pink-500", Bug: "bg-lime-500",
  Rock: "bg-stone-500", Ghost: "bg-purple-700", Dragon: "bg-indigo-600", Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400", Fairy: "bg-pink-300",
};

const PokemonInfoModal: React.FC<PokemonInfoModalProps> = ({
  pokemon,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedId = normalizePokedexNumber(pokemon.id);
  
  const handleInfoClick = (e: React.MouseEvent) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] PokemonInfoModal: Trigger clicked for ${pokemon.name}`);
    e.stopPropagation();
    e.preventDefault();
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] PokemonInfoModal: Dialog clicked for ${pokemon.name}`);
    e.stopPropagation();
  };

  const handleDialogOpen = (open: boolean) => {
    console.log(`🔘 [INFO_BUTTON_DEBUG] PokemonInfoModal: Dialog ${open ? 'opened' : 'closed'} for ${pokemon.name}`);
    console.log(`🔘 [INFO_BUTTON_DEBUG] PokemonInfoModal: Modal state changed to: ${open}`);
    setIsOpen(open);
  };

  const statNames: Record<string, string> = {
    hp: "HP",
    attack: "Attack", 
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed"
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild onClick={handleInfoClick}>
        {children || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-6 h-6 p-0 rounded-full bg-white/90 hover:bg-white shadow-sm border"
            data-info-button="true"
          >
            <Info className="w-3 h-3 text-blue-600" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl z-[9999]" 
        onClick={handleDialogClick}
        data-radix-dialog-content="true"
        style={{ zIndex: 9999 }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {pokemon.name}
          </DialogTitle>
        </DialogHeader>
        
        {/* Game-inspired layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Pokemon image and basic info */}
          <div className="space-y-4">
            {/* Pokemon image with border like the game */}
            <div className="bg-gray-100 border-4 border-gray-400 rounded p-4 text-center">
              <img 
                src={pokemon.image} 
                alt={pokemon.name}
                className="w-32 h-32 mx-auto object-contain"
              />
            </div>
            
            {/* Basic info section */}
            <div className="bg-gray-200 border-2 border-gray-400 rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">No.</span>
                <span className="font-mono">#{normalizedId}</span>
              </div>
              
              {pokemon.types && pokemon.types.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-bold">Type:</span>
                  <div className="flex gap-1">
                    {pokemon.types.map(type => (
                      <Badge key={type} className={`${typeColors[type]} text-white text-xs px-2 py-0.5`}>
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {pokemon.height && (
                <div className="flex justify-between items-center">
                  <span className="font-bold">Height:</span>
                  <span>{(pokemon.height / 10).toFixed(1)} m</span>
                </div>
              )}

              {pokemon.weight && (
                <div className="flex justify-between items-center">
                  <span className="font-bold">Weight:</span>
                  <span>{(pokemon.weight / 10).toFixed(1)} kg</span>
                </div>
              )}

              {pokemon.generation && (
                <div className="flex justify-between items-center">
                  <span className="font-bold">Generation:</span>
                  <span>{pokemon.generation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Stats in game style */}
          <div className="space-y-4">
            {pokemon.stats && Object.keys(pokemon.stats).length > 0 && (
              <div className="bg-green-600 border-4 border-green-800 rounded overflow-hidden">
                <div className="bg-green-700 text-white text-center py-2 font-bold text-lg">
                  STATS
                </div>
                <div className="bg-gray-300 p-4 space-y-2">
                  {Object.entries(pokemon.stats).map(([stat, value]) => {
                    const displayName = statNames[stat] || stat.replace('-', ' ');
                    const maxStat = 255;
                    const percentage = Math.min((value / maxStat) * 100, 100);
                    
                    return (
                      <div key={stat} className="flex items-center justify-between">
                        <span className="font-bold text-sm w-20">{displayName}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 bg-white border border-gray-400 h-4 rounded overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                value >= 100 ? 'bg-orange-500' : 
                                value >= 80 ? 'bg-yellow-500' : 
                                value >= 60 ? 'bg-blue-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm w-8 text-right">{value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description section */}
            {pokemon.flavorText && (
              <div className="bg-gray-200 border-2 border-gray-400 rounded p-4">
                <h3 className="font-bold mb-2">Description:</h3>
                <p className="text-sm leading-relaxed">{pokemon.flavorText}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PokemonInfoModal;
