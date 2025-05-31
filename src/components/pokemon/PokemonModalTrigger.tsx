
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
  const handleClick = (e: React.MouseEvent) => {
    console.log(`🔘🔘🔘 [MODAL_TRIGGER_DEBUG] Modal trigger clicked for ${pokemon.name}`);
    // Prevent any propagation to parent drag elements
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <DialogTrigger asChild>
      {children || (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-6 h-6 p-0 rounded-full bg-white/90 hover:bg-white shadow-sm border relative"
          onClick={handleClick}
        >
          <Info className="w-3 h-3 text-blue-600" />
        </Button>
      )}
    </DialogTrigger>
  );
};

export default PokemonModalTrigger;
