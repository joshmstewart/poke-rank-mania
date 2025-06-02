
import React from "react";
import { Pokemon } from "@/services/pokemon";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

interface TCGBattleCardInfoButtonProps {
  pokemon: Pokemon;
}

const TCGBattleCardInfoButton: React.FC<TCGBattleCardInfoButtonProps> = ({
  pokemon
}) => {
  return (
    <div className="absolute top-1 right-1 z-30">
      <PokemonInfoModal pokemon={pokemon} />
    </div>
  );
};

export default TCGBattleCardInfoButton;
