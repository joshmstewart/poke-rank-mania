
import React, { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import PokemonBasicInfo from "./PokemonBasicInfo";
import PokemonStats from "./PokemonStats";
import PokemonDescription from "./PokemonDescription";
import PokemonTCGCardDisplay from "./PokemonTCGCardDisplay";
import Logo from "@/components/ui/Logo";

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
  
  useEffect(() => {
    console.log(`🔘 [MODAL_DEBUG] PokemonInfoModal for ${pokemon.name} mounted, isOpen: ${isOpen}`);
  }, [pokemon.name, isOpen]);

  useEffect(() => {
    console.log(`🔘 [MODAL_DEBUG] Modal state effect - isOpen changed to: ${isOpen} for ${pokemon.name}`);
    
    if (isOpen) {
      // Add more comprehensive DOM inspection when modal opens
      setTimeout(() => {
        const modal = document.querySelector('[data-radix-dialog-content="true"]');
        const overlay = document.querySelector('[data-radix-dialog-overlay]');
        
        console.log(`🔘 [MODAL_DEBUG] DOM check - Modal element found: ${!!modal}, Overlay found: ${!!overlay}`);
        
        if (modal) {
          const modalStyle = window.getComputedStyle(modal);
          const modalRect = modal.getBoundingClientRect();
          console.log(`🔘 [MODAL_DEBUG] Modal computed styles:`, {
            display: modalStyle.display,
            visibility: modalStyle.visibility,
            zIndex: modalStyle.zIndex,
            opacity: modalStyle.opacity,
            position: modalStyle.position,
            transform: modalStyle.transform
          });
          console.log(`🔘 [MODAL_DEBUG] Modal bounding rect:`, modalRect);
          
          if (overlay) {
            const overlayStyle = window.getComputedStyle(overlay);
            const overlayRect = overlay.getBoundingClientRect();
            console.log(`🔘 [MODAL_DEBUG] Overlay computed styles:`, {
              display: overlayStyle.display,
              visibility: overlayStyle.visibility,
              zIndex: overlayStyle.zIndex,
              opacity: overlayStyle.opacity,
              position: overlayStyle.position
            });
            console.log(`🔘 [MODAL_DEBUG] Overlay bounding rect:`, overlayRect);
            
            // Check if overlay is covering the modal
            const modalZ = parseInt(modalStyle.zIndex);
            const overlayZ = parseInt(overlayStyle.zIndex);
            console.log(`🔘 [MODAL_DEBUG] Z-index comparison: Modal=${modalZ}, Overlay=${overlayZ}`);
            console.log(`🔘 [MODAL_DEBUG] Modal should be on top: ${modalZ > overlayZ}`);
          }
        }
        
        if (overlay && !modal) {
          const overlayStyle = window.getComputedStyle(overlay);
          const overlayRect = overlay.getBoundingClientRect();
          console.log(`🔘 [MODAL_DEBUG] Overlay computed styles:`, {
            display: overlayStyle.display,
            visibility: overlayStyle.visibility,
            zIndex: overlayStyle.zIndex,
            opacity: overlayStyle.opacity,
            position: overlayStyle.position
          });
          console.log(`🔘 [MODAL_DEBUG] Overlay bounding rect:`, overlayRect);
        }

        // Check for any parent elements that might be interfering
        if (modal) {
          let parent = modal.parentElement;
          let level = 0;
          while (parent && level < 5) {
            const parentStyle = window.getComputedStyle(parent);
            console.log(`🔘 [MODAL_DEBUG] Parent level ${level}:`, {
              tagName: parent.tagName,
              className: parent.className,
              zIndex: parentStyle.zIndex,
              position: parentStyle.position,
              transform: parentStyle.transform
            });
            parent = parent.parentElement;
            level++;
          }
        }
      }, 200);
    }
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
    
    // Notify parent component about modal state change
    if (onOpenChange) {
      onOpenChange(open);
    }
  };
  
  console.log(`🔘 [MODAL_DEBUG] Rendering PokemonInfoModal for ${pokemon.name}, isOpen: ${isOpen}`);
  console.log(`🃏 [TCG_DEBUG] TCG card state for ${pokemon.name}:`, { hasTcgCard, isLoadingTCG, tcgError });

  // Determine what content to show
  const showLoading = isLoadingTCG;
  const showTCGCards = !isLoadingTCG && hasTcgCard && tcgCard;
  const showFallbackInfo = !isLoadingTCG && !hasTcgCard;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild onClick={handleInfoClick}>
        {children || (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-6 h-6 p-0 rounded-full bg-white/90 hover:bg-white shadow-sm border relative"
            data-info-button="true"
          >
            <Info className="w-3 h-3 text-blue-600" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={handleDialogClick}
        data-radix-dialog-content="true"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {pokemon.name}
          </DialogTitle>
        </DialogHeader>

        {/* Loading state with logo */}
        {showLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-pulse">
              <Logo />
            </div>
            <p className="text-lg font-medium text-gray-600">Loading card data...</p>
          </div>
        )}

        {/* Display TCG cards if available */}
        {showTCGCards && (
          <PokemonTCGCardDisplay tcgCard={tcgCard} secondCard={secondTcgCard} />
        )}

        {/* Fallback to original info layout if no TCG cards */}
        {showFallbackInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side - Pokemon image and basic info */}
            <PokemonBasicInfo pokemon={pokemon} />

            {/* Right side - Stats and description */}
            <div className="space-y-4">
              <PokemonStats pokemon={pokemon} />
              <PokemonDescription flavorText={flavorText} isLoadingFlavor={isLoadingFlavor} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PokemonInfoModal;
