
import React from "react";
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";
import { RefinementQueueProvider } from "@/components/battle/RefinementQueueProvider";

const PokemonRanker = () => {
  return (
    <RefinementQueueProvider>
      <PokemonRankerWithProvider />
    </RefinementQueueProvider>
  );
};

export default PokemonRanker;
