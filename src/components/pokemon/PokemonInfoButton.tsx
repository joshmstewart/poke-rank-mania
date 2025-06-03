
import React, { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PokemonModalContent from "@/components/pokemon/PokemonModalContent";
import { Pokemon, RankedPokemon } from "@/services/pokemon";

interface PokemonInfoButtonProps {
  pokemon: Pokemon | RankedPokemon;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isDragging: boolean;
  showLoading: boolean;
  showTCGCards: boolean;
  showFallbackInfo: boolean;
  tcgCard: any;
  secondTcgCard: any;
  flavorText: string;
  isLoadingFlavor: boolean;
}

const PokemonInfoButton: React.FC<PokemonInfoButtonProps> = ({
  pokemon,
  isOpen,
  setIsOpen,
  isDragging,
  showLoading,
  showTCGCards,
  showFallbackInfo,
  tcgCard,
  secondTcgCard,
  flavorText,
  isLoadingFlavor
}) => {
  const handleDialogClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (isDragging) return null;

  return (
    <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button 
            className="w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Info button clicked for ${pokemon.name}`);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            type="button"
            style={{ pointerEvents: 'auto' }}
          >
            i
          </button>
        </DialogTrigger>
        
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={handleDialogClick}
          data-radix-dialog-content="true"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {pokemon.name}
            </DialogTitle>
          </DialogHeader>

          <PokemonModalContent
            pokemon={pokemon}
            showLoading={showLoading}
            showTCGCards={showTCGCards}
            showFallbackInfo={showFallbackInfo}
            tcgCard={tcgCard}
            secondTcgCard={secondTcgCard}
            flavorText={flavorText}
            isLoadingFlavor={isLoadingFlavor}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PokemonInfoButton;
