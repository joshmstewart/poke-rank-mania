
import React from "react";
import PokemonInfo from "./PokemonInfo";

interface BattleCardInfoProps {
  displayName: string;
  pokemonId: number;
  types?: string[];
}

const BattleCardInfo: React.FC<BattleCardInfoProps> = ({
  displayName,
  pokemonId,
  types
}) => {
  return (
    <PokemonInfo 
      displayName={displayName}
      pokemonId={pokemonId}
      types={types}
    />
  );
};

export default BattleCardInfo;
