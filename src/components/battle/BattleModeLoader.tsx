
import React, { useEffect, useState, useRef } from "react";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

interface BattleModeLoaderProps {
  onPokemonLoaded: (pokemon: any[], rawPokemon?: any[]) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

const BattleModeLoader: React.FC<BattleModeLoaderProps> = ({
  onPokemonLoaded,
  onLoadingChange
}) => {
  const { allPokemon, rawUnfilteredPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);

  // PERFORMANCE FIX: Optimized loading with progress feedback
  useEffect(() => {
    const loadPokemonOnce = async () => {
      if (!loaderInitiatedRef.current) {
        try {
          console.log(`🚀 [PERFORMANCE_FIX] Starting optimized Pokemon load`);
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          
          // Show immediate feedback
          onLoadingChange(true);
          
          await loadPokemon(0, true);
          console.log(`✅ [PERFORMANCE_FIX] Pokemon load completed efficiently`);
        } catch (error) {
          console.error("❌ Failed to load Pokémon:", error);
        }
      }
    };

    loadPokemonOnce();
  }, []); // PERFORMANCE FIX: Empty dependency array - only load once

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  // CRITICAL FIX: Notify parent when Pokemon are loaded, including raw data
  useEffect(() => {
    if (allPokemon && allPokemon.length > 0) {
      console.log(`✅ [PERFORMANCE_FIX] Notifying parent of ${allPokemon.length} filtered + ${rawUnfilteredPokemon.length} raw Pokemon (optimized load)`);
      onPokemonLoaded(allPokemon, rawUnfilteredPokemon);
    }
  }, [allPokemon, rawUnfilteredPokemon, onPokemonLoaded]);

  return null; // This is a logic-only component
};

export default BattleModeLoader;
