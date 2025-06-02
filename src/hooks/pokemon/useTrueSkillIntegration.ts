
import { useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";

interface UseTrueSkillIntegrationProps {
  isLoading: boolean;
  storeLoading: boolean;
  availablePokemon: Pokemon[];
  rankedPokemon: Pokemon[];
  setRankedPokemon: (value: Pokemon[]) => void;
  setAvailablePokemon: (value: Pokemon[]) => void;
  setConfidenceScores: (value: Record<number, number>) => void;
}

export const useTrueSkillIntegration = ({
  isLoading,
  storeLoading,
  availablePokemon,
  rankedPokemon,
  setRankedPokemon,
  setAvailablePokemon,
  setConfidenceScores
}: UseTrueSkillIntegrationProps) => {
  const { loadFromCloud, syncInProgress } = useTrueSkillStore();
  
  // Load data from cloud on startup - simplified
  useEffect(() => {
    const initializeFromCloud = async () => {
      console.log("[TRUESKILL_INTEGRATION] Loading data from cloud...");
      await loadFromCloud();
      console.log("[TRUESKILL_INTEGRATION] Cloud load completed");
    };
    
    initializeFromCloud();
  }, [loadFromCloud]);

  // Note: The main sync logic is now handled directly in PokemonRanker.tsx
  // This hook is simplified to focus only on cloud loading
  console.log("[TRUESKILL_INTEGRATION] Hook active - main sync handled by PokemonRanker");

  return {
    isStoreLoading: syncInProgress
  };
};
