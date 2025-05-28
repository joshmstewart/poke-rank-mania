
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
import PokemonBasicInfo from "./PokemonBasicInfo";
import PokemonStats from "./PokemonStats";
import PokemonDescription from "./PokemonDescription";

interface PokemonInfoModalProps {
  pokemon: Pokemon;
  children?: React.ReactNode;
}

const PokemonInfoModal: React.FC<PokemonInfoModalProps> = ({
  pokemon,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  
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
          <PokemonBasicInfo pokemon={pokemon} />

          {/* Right side - Stats and description */}
          <div className="space-y-4">
            <PokemonStats pokemon={pokemon} />
            <PokemonDescription flavorText={flavorText} isLoadingFlavor={isLoadingFlavor} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PokemonInfoModal;
