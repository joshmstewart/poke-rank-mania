
import React, { useEffect, useState, useRef } from "react";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

interface BattleModeLoaderProps {
  onPokemonLoaded: (pokemon: any[]) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

const BattleModeLoader: React.FC<BattleModeLoaderProps> = ({
  onPokemonLoaded,
  onLoadingChange
}) => {
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);

  // CRITICAL FIX: Pokemon loading ONLY happens once
  useEffect(() => {
    const loadPokemonOnce = async () => {
      if (!loaderInitiatedRef.current) {
        try {
          console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeLoader initiating ONE-TIME complete Pokemon load`);
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          await loadPokemon(0, true);
          console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeLoader complete Pokemon load finished - WILL NOT RELOAD AGAIN`);
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
        }
      }
    };

    loadPokemonOnce();
  }, []); // CRITICAL FIX: Empty dependency array - only load once ever

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  // Notify parent when Pokemon are loaded
  useEffect(() => {
    if (allPokemon && allPokemon.length > 0) {
      console.log(`🔒 [POKEMON_LOADING_FIX] BattleModeLoader notifying parent of ${allPokemon.length} Pokemon`);
      onPokemonLoaded(allPokemon);
    }
  }, [allPokemon, onPokemonLoaded]);

  return null; // This is a logic-only component
};

export default BattleModeLoader;
