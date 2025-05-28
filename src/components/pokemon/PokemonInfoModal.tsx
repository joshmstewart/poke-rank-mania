import React, { useState, useEffect } from "react";
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
import { generations } from "@/services/pokemon";

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
  const [flavorText, setFlavorText] = useState<string>("");
  const [isLoadingFlavor, setIsLoadingFlavor] = useState(false);
  const normalizedId = normalizePokedexNumber(pokemon.id);
  
  // Get base Pokemon ID for variant forms
  const getBasePokemonId = (pokemonId: number) => {
    // For variant forms, we need to find the base form
    if (pokemonId > 1025) {
      // This is likely a variant form, try to map it to a base form
      // For now, we'll use a simple approach - in a real app you'd have a mapping
      return Math.min(pokemonId, 1025);
    }
    return pokemonId;
  };

  // Get generation name from Pokemon ID
  const getGenerationName = (pokemonId: number) => {
    const baseId = getBasePokemonId(pokemonId);
    const generation = generations.find(gen => 
      gen.id !== 0 && baseId >= gen.start && baseId <= gen.end
    );
    return generation ? generation.name : "Unknown Generation";
  };

  const generationName = getGenerationName(pokemon.id);
  
  // Fetch flavor text when modal opens
  useEffect(() => {
    if (isOpen && !flavorText && !isLoadingFlavor) {
      setIsLoadingFlavor(true);
      const baseId = getBasePokemonId(pokemon.id);
      
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${baseId}`)
        .then(res => res.json())
        .then(data => {
          // Get English flavor text from the most recent game
          const englishEntries = data.flavor_text_entries?.filter(
            (entry: any) => entry.language.name === 'en'
          );
          
          if (englishEntries && englishEntries.length > 0) {
            // Get the most recent entry (usually the last one)
            const latestEntry = englishEntries[englishEntries.length - 1];
            const cleanText = latestEntry.flavor_text
              .replace(/\f/g, ' ')
              .replace(/\n/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            setFlavorText(cleanText);
          }
        })
        .catch(error => {
          console.error('Failed to fetch flavor text:', error);
          setFlavorText("Description not available.");
        })
        .finally(() => {
          setIsLoadingFlavor(false);
        });
    }
  }, [isOpen, pokemon.id, flavorText, isLoadingFlavor]);
  
  useEffect(() => {
    console.log(`🔘 [MODAL_DEBUG] PokemonInfoModal for ${pokemon.name} mounted, isOpen: ${isOpen}`);
  }, [pokemon.name, isOpen]);

  useEffect(() => {
    console.log(`🔘 [MODAL_DEBUG] Modal state effect - isOpen changed to: ${isOpen} for ${pokemon.name}`);
    
    // Check if modal is actually in DOM
    setTimeout(() => {
      const modal = document.querySelector('[data-radix-dialog-content="true"]');
      const overlay = document.querySelector('[data-radix-dialog-overlay]');
      console.log(`🔘 [MODAL_DEBUG] DOM check - Modal element found: ${!!modal}, Overlay found: ${!!overlay}`);
      if (modal) {
        const modalStyle = window.getComputedStyle(modal);
        console.log(`🔘 [MODAL_DEBUG] Modal computed styles:`, {
          display: modalStyle.display,
          visibility: modalStyle.visibility,
          zIndex: modalStyle.zIndex,
          opacity: modalStyle.opacity
        });
      }
    }, 100);
  }, [isOpen, pokemon.name]);
  
  const handleInfoClick = (e: React.MouseEvent) => {
    console.log(`🔘 [MODAL_DEBUG] PokemonInfoModal: Trigger clicked for ${pokemon.name}`);
    console.log(`🔘 [MODAL_DEBUG] Current isOpen state: ${isOpen}`);
    e.stopPropagation();
    e.preventDefault();
    
    // Force open the modal
    console.log(`🔘 [MODAL_DEBUG] About to set isOpen to true`);
    setIsOpen(true);
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    console.log(`🔘 [MODAL_DEBUG] PokemonInfoModal: Dialog clicked for ${pokemon.name}`);
    e.stopPropagation();
  };

  const handleDialogOpen = (open: boolean) => {
    console.log(`🔘 [MODAL_DEBUG] PokemonInfoModal: Dialog ${open ? 'opened' : 'closed'} for ${pokemon.name}`);
    console.log(`🔘 [MODAL_DEBUG] PokemonInfoModal: Modal state changed to: ${open}`);
    console.log(`🔘 [MODAL_DEBUG] Previous state was: ${isOpen}`);
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
  
  console.log(`🔘 [MODAL_DEBUG] Rendering PokemonInfoModal for ${pokemon.name}, isOpen: ${isOpen}`);
  
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
        className="max-w-2xl" 
        onClick={handleDialogClick}
        data-radix-dialog-content="true"
        style={{ 
          zIndex: 10000,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white'
        }}
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

              <div className="flex justify-between items-center">
                <span className="font-bold">Generation:</span>
                <span>{generationName}</span>
              </div>
            </div>
          </div>

          {/* Right side - Stats and description */}
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
            <div className="bg-gray-200 border-2 border-gray-400 rounded p-4">
              <h3 className="font-bold mb-2">Description:</h3>
              {isLoadingFlavor ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{flavorText || "Loading description..."}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PokemonInfoModal;
