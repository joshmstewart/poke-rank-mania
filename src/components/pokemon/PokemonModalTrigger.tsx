
import React from "react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { Pokemon } from "@/services/pokemon";

interface PokemonModalTriggerProps {
  children?: React.ReactNode;
  pokemon: Pokemon;
}

const PokemonModalTrigger: React.FC<PokemonModalTriggerProps> = ({
  children,
  pokemon
}) => {
  const handleTriggerClick = (e: React.MouseEvent) => {
    console.log(`🔘🔘🔘 [MODAL_TRIGGER_DEBUG] Modal trigger clicked for ${pokemon.name}`);
    // CRITICAL FIX: Only prevent propagation, don't prevent default
    e.stopPropagation();
  };

  const handleTriggerPointerDown = (e: React.PointerEvent) => {
    console.log(`🔘🔘🔘 [MODAL_TRIGGER_DEBUG] Modal trigger pointer down for ${pokemon.name}`);
    // CRITICAL FIX: Only prevent propagation for pointer events
    e.stopPropagation();
  };

  const handleTriggerMouseDown = (e: React.MouseEvent) => {
    console.log(`🔘🔘🔘 [MODAL_TRIGGER_DEBUG] Modal trigger mouse down for ${pokemon.name}`);
    // CRITICAL FIX: Only prevent propagation for mouse events
    e.stopPropagation();
  };

  return (
    <DialogTrigger asChild>
      {children || (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-6 h-6 p-0 rounded-full bg-white/90 hover:bg-white shadow-sm border relative z-50"
          data-info-button="true"
          onClick={handleTriggerClick}
          onPointerDown={handleTriggerPointerDown}
          onMouseDown={handleTriggerMouseDown}
        >
          <Info className="w-3 h-3 text-blue-600" />
        </Button>
      )}
    </DialogTrigger>
  );
};

export default PokemonModalTrigger;
