
import React, { useEffect, useState } from "react";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { Pokemon } from "@/services/pokemon";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

interface PokemonRankerProviderProps {
  children: React.ReactNode;
}

const PokemonRankerProvider: React.FC<PokemonRankerProviderProps> = ({ children }) => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const { loadPokemon, isLoading } = usePokemonLoader();

  useEffect(() => {
    const loadData = async () => {
      console.log(`🔒 [MANUAL_MODE_PROVIDER] Loading Pokemon for Manual Mode`);
      const pokemon = await loadPokemon(0, true); // Load all generations
      console.log(`🔒 [MANUAL_MODE_PROVIDER] Loaded ${pokemon.length} Pokemon for Manual Mode`);
      setAllPokemon(pokemon);
    };

    loadData();
  }, [loadPokemon]);

  if (isLoading || allPokemon.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading Pokémon data for Manual Mode...</p>
        </div>
      </div>
    );
  }

  console.log(`🔒 [MANUAL_MODE_PROVIDER] Providing ${allPokemon.length} Pokemon to Manual Mode context`);
  
  return (
    <PokemonProvider allPokemon={allPokemon}>
      {children}
    </PokemonProvider>
  );
};

export default PokemonRankerProvider;
