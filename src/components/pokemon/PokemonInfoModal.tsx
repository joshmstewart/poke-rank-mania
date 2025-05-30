
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
      // Enhanced debugging when modal opens
      setTimeout(() => {
        console.log(`🔘 [MODAL_DEBUG] === COMPREHENSIVE DIALOG DEBUG FOR ${pokemon.name} ===`);
        
        // Check the current modal's DOM hierarchy
        const currentModal = document.querySelector(`[data-radix-dialog-content="true"]`);
        if (currentModal) {
          console.log(`🔘 [MODAL_DEBUG] Found modal in DOM, checking hierarchy...`);
          
          // Walk up the DOM tree to understand the structure
          let element = currentModal;
          let depth = 0;
          while (element && depth < 15) {
            const style = window.getComputedStyle(element);
            console.log(`🔘 [MODAL_DEBUG] Level ${depth}: ${element.tagName}`, {
              className: element.className,
              id: element.id,
              zIndex: style.zIndex,
              position: style.position,
              transform: style.transform,
              opacity: style.opacity,
              display: style.display
            });
            
            element = element.parentElement;
            depth++;
          }
        }
        
        // Check ALL dialog-related elements in the entire document
        const allDialogElements = document.querySelectorAll('*[data-radix-dialog], *[role="dialog"], *[data-state]');
        console.log(`🔘 [MODAL_DEBUG] Found ${allDialogElements.length} dialog-related elements in document`);
        
        allDialogElements.forEach((el, index) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          console.log(`🔘 [MODAL_DEBUG] Dialog element ${index}:`, {
            tagName: el.tagName,
            role: el.getAttribute('role'),
            dataState: el.getAttribute('data-state'),
            className: el.className,
            zIndex: style.zIndex,
            position: style.position,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            isVisible: rect.width > 0 && rect.height > 0,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
        });
        
        // Check if there are multiple portals or conflicting elements
        const portals = document.querySelectorAll('[data-radix-portal]');
        console.log(`🔘 [MODAL_DEBUG] Found ${portals.length} portal containers`);
        portals.forEach((portal, index) => {
          console.log(`🔘 [MODAL_DEBUG] Portal ${index} contents:`, {
            childElementCount: portal.childElementCount,
            children: Array.from(portal.children).map(child => ({
              tagName: child.tagName,
              className: child.className,
              role: child.getAttribute('role'),
              dataState: child.getAttribute('data-state')
            }))
          });
        });
        
        // Check if our specific modal content is actually visible
        const modalContent = document.querySelector('[data-radix-dialog-content="true"]');
        if (modalContent) {
          const contentRect = modalContent.getBoundingClientRect();
          const isActuallyVisible = contentRect.width > 0 && contentRect.height > 0 && 
                                   contentRect.top >= 0 && contentRect.left >= 0;
          console.log(`🔘 [MODAL_DEBUG] Modal content visibility check:`, {
            hasSize: contentRect.width > 0 && contentRect.height > 0,
            inViewport: contentRect.top >= 0 && contentRect.left >= 0,
            actuallyVisible: isActuallyVisible,
            rect: contentRect
          });
        }
        
      }, 300); // Increased timeout to ensure everything is rendered
    }
  }, [isOpen, pokemon.name]);
  
  const handleInfoClick = (e: React.MouseEvent) => {
    console.log(`🔘 [MODAL_DEBUG] PokemonInfoModal: Trigger clicked for ${pokemon.name}`);
    console.log(`🔘 [MODAL_DEBUG] Current isOpen state: ${isOpen}`);
    e.stopPropagation();
    e.preventDefault();
    
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
