
import React from "react";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { Pokemon } from "@/services/pokemon";

interface BattleModeProviderProps {
  allPokemon: Pokemon[];
  rawUnfilteredPokemon?: Pokemon[];
  children: React.ReactNode;
}

const BattleModeProvider: React.FC<BattleModeProviderProps> = ({
  allPokemon,
  rawUnfilteredPokemon,
  children
}) => {
  console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeProvider providing ${allPokemon.length} filtered + ${rawUnfilteredPokemon?.length || 0} raw Pokemon to context`);
  
  return (
    <PokemonProvider 
      allPokemon={allPokemon}
      rawUnfilteredPokemon={rawUnfilteredPokemon}
    >
      {children}
    </PokemonProvider>
  );
};

export default BattleModeProvider;
