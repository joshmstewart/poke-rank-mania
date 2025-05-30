
import React from "react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";

interface PokemonModalTriggerProps {
  children?: React.ReactNode;
  onTriggerClick: (e: React.MouseEvent) => void;
}

const PokemonModalTrigger: React.FC<PokemonModalTriggerProps> = ({
  children,
  onTriggerClick
}) => {
  return (
    <DialogTrigger asChild onClick={onTriggerClick}>
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
  );
};

export default PokemonModalTrigger;
