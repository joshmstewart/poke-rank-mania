
import { useState, useCallback, useRef, useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleState } from "./useBattleState";

export const useBattleStateManager = (
  stableInitialBattleType: BattleType,
  stableInitialGeneration: number
) => {
  const initializationRef = useRef(false);
  const hookInstanceRef = useRef(`state-manager-${Date.now()}`);
  
  if (!initializationRef.current) {
    console.log(`[DEBUG useBattleStateManager] INIT - Instance: ${hookInstanceRef.current}`);
    initializationRef.current = true;
  }
  
  const [needsToReloadSuggestions, setNeedsToReloadSuggestions] = useState(false);
  
  // Use the extracted battle state hook
  const battleStateData = useBattleState(stableInitialBattleType, stableInitialGeneration);

  const triggerSuggestionPrioritization = useCallback(() => {
    console.log('[DEBUG] Basic suggestion prioritization triggered');
  }, []);

  const lastSuggestionLoadTimestampRef = useRef<number>(Date.now());
  const rankingsGenerationDelayRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedGenerateRankings = useMemo(() => {
    return (generateRankings: (results: any[]) => void, results: any[]) => {
      if (rankingsGenerationDelayRef.current) {
        clearTimeout(rankingsGenerationDelayRef.current);
      }
      
      rankingsGenerationDelayRef.current = setTimeout(() => {
        console.log("[DEBOUNCED] Generating rankings after delay");
        generateRankings(results);
        rankingsGenerationDelayRef.current = null;
      }, 150);
    };
  }, []);

  return {
    ...battleStateData,
    needsToReloadSuggestions,
    setNeedsToReloadSuggestions,
    triggerSuggestionPrioritization,
    lastSuggestionLoadTimestampRef,
    debouncedGenerateRankings
  };
};
