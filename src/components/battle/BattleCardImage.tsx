
import React from "react";
import PokemonImage from "./PokemonImage";

interface BattleCardImageProps {
  imageUrl: string;
  displayName: string;
  pokemonId: number;
}

const BattleCardImage: React.FC<BattleCardImageProps> = ({
  imageUrl,
  displayName,
  pokemonId
}) => {
  return (
    <PokemonImage 
      imageUrl={imageUrl}
      displayName={displayName}
      pokemonId={pokemonId}
    />
  );
};

export default BattleCardImage;
