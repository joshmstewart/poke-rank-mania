
import React from "react";
import PokemonRanker from "../PokemonRanker";
import PokemonRankerProvider from "./PokemonRankerProvider";

const PokemonRankerWithProvider: React.FC = () => {
  return (
    <PokemonRankerProvider>
      <PokemonRanker />
    </PokemonRankerProvider>
  );
};

export default PokemonRankerWithProvider;
