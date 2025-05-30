
import React, { useState } from "react";
import { Pokemon } from "@/services/pokemon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import PokemonModalTrigger from "./PokemonModalTrigger";
import PokemonModalContent from "./PokemonModalContent";
import PokemonModalLoading from "./PokemonModalLoading";

interface PokemonInfoModalProps {
  pokemon: Pokemon;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

const PokemonInfoModal: React.FC<PokemonInfoModalProps> = ({
  pokemon,
  children,
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard, secondTcgCard, isLoading: isLoadingTCG, error: tcgError, hasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);
  
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
    
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  // Determine what content to show
  const showLoading = isLoadingTCG;
  const showTCGCards = !isLoadingTCG && hasTcgCard && tcgCard;
  const showFallbackInfo = !isLoadingTCG && !hasTcgCard;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <PokemonModalTrigger onTriggerClick={handleInfoClick}>
        {children}
      </PokemonModalTrigger>
      
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

        {/* Loading state */}
        {showLoading && <PokemonModalLoading />}

        {/* Modal content */}
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
  );
};

export default PokemonInfoModal;
