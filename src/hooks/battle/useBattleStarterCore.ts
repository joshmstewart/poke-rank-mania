
import { useMemo, useRef } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";

// Helper to compare battles
const areBattlesIdentical = (battle1: Pokemon[], battle2: number[]) => {
  if (!battle1 || !battle2 || battle1.length !== battle2.length) return false;
  const battle1Ids = battle1.map(p => p.id);
  return battle1Ids.every(id => battle2.includes(id)) && 
         battle2.every(id => battle1Ids.includes(id));
};

// Define extended interface for the battleStarter object that includes getSuggestions
interface ExtendedBattleStarter {
  startNewBattle: (battleType: BattleType, forceSuggestion?: boolean, forceUnranked?: boolean) => Pokemon[];
  trackLowerTierLoss: (loserId: number) => void;
  getSuggestions: () => RankedPokemon[];
}

// CRITICAL FIX: Create default empty ExtendedBattleStarter for safe initialization
const createEmptyBattleStarter = (): ExtendedBattleStarter => ({
  startNewBattle: () => {
    console.warn('[BattleStarter NO_DATA] startNewBattle called but no Pokémon data was available on creation.');
    return [];
  },
  trackLowerTierLoss: () => {},
  getSuggestions: () => []
});

export const useBattleStarterCore = (
  allPokemon: Pokemon[] = [],
  currentRankings: RankedPokemon[] = []
) => {
  // CRITICAL FIX: Single global battleStarter instance - NEVER recreate
  const battleStarterInstanceRef = useRef<ExtendedBattleStarter | null>(null);
  const battleStarterCreatedRef = useRef(false);

  // CRITICAL FIX: Create battleStarter exactly ONCE and store it permanently
  const battleStarter = useMemo<ExtendedBattleStarter>(() => {
    console.log('[CRITICAL FIX] battleStarter useMemo - battleStarterCreatedRef.current:', battleStarterCreatedRef.current);
    
    // If battleStarter already exists, return it immediately - NEVER recreate
    if (battleStarterCreatedRef.current && battleStarterInstanceRef.current) {
      console.log('[CRITICAL FIX] Returning existing battleStarter instance - Pokemon count changes will NOT recreate');
      return battleStarterInstanceRef.current;
    }

    if (!allPokemon || allPokemon.length === 0) {
      console.log("[CRITICAL FIX] No Pokémon data available, returning empty battleStarter");
      return createEmptyBattleStarter();
    }

    console.log(`[CRITICAL FIX] Creating battleStarter PERMANENTLY with ${allPokemon.length} Pokémon`);
    
    const battleStarterInstance = createBattleStarter(
      allPokemon,
      currentRankings
    );
    
    const extendedInstance: ExtendedBattleStarter = {
      startNewBattle: battleStarterInstance.startNewBattle,
      trackLowerTierLoss: battleStarterInstance.trackLowerTierLoss,
      getSuggestions: () => {
        return (currentRankings || []).filter(
          p => p.suggestedAdjustment && !p.suggestedAdjustment.used
        );
      }
    };

    // CRITICAL FIX: Store the instance permanently and mark as created
    battleStarterInstanceRef.current = extendedInstance;
    battleStarterCreatedRef.current = true;
    
    console.log("[CRITICAL FIX] BattleStarter created PERMANENTLY - will NEVER be recreated");
    
    return extendedInstance;
  }, [allPokemon.length > 0 ? 'HAS_POKEMON' : 'NO_POKEMON']); // CRITICAL: Only depend on whether we have Pokemon at all

  return {
    battleStarter,
    areBattlesIdentical
  };
};
