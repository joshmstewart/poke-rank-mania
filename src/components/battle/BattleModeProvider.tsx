
import React from "react";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { Pokemon } from "@/services/pokemon";

interface BattleModeProviderProps {
  allPokemon: Pokemon[];
  children: React.ReactNode;
}

const BattleModeProvider: React.FC<BattleModeProviderProps> = ({
  allPokemon,
  children
}) => {
  console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeProvider providing ${allPokemon.length} Pokemon to context`);
  
  return (
    <PokemonProvider allPokemon={allPokemon}>
      {children}
    </PokemonProvider>
  );
};

export default BattleModeProvider;
