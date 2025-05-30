
import React from "react";
import { Pokemon } from "@/services/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface TCGBattleCardInfoButtonProps {
  pokemon: Pokemon;
  onModalStateChange: (open: boolean) => void;
  onInfoButtonInteraction: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
}

const TCGBattleCardInfoButton: React.FC<TCGBattleCardInfoButtonProps> = ({
  pokemon,
  onModalStateChange,
  onInfoButtonInteraction,
  onMouseEnter
}) => {
  return (
    <div className="absolute top-1 right-1 z-30">
      <PokemonInfoModal 
        pokemon={pokemon}
        onOpenChange={onModalStateChange}
      >
        <button 
          className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
          onClick={onInfoButtonInteraction}
          onMouseEnter={onMouseEnter}
          data-info-button="true"
        >
          i
        </button>
      </PokemonInfoModal>
    </div>
  );
};

export default TCGBattleCardInfoButton;
