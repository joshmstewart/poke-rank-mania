
import { useState, useMemo } from "react";
import { BattleType } from "@/hooks/battle/types";

export const useEnhancedRankingUI = () => {
  // CRITICAL FIX: Stable initial state to prevent re-renders
  const initialBattleType = useMemo((): BattleType => {
    try {
      const stored = localStorage.getItem('pokemon-ranker-battle-type') as BattleType | null;
      if (stored && (stored === "pairs" || stored === "triplets")) {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to read battle type from localStorage:', e);
    }
    return "pairs";
  }, []);

  const [battleType, setBattleType] = useState<BattleType>(initialBattleType);

  // CRITICAL FIX: Stable callback to prevent re-renders
  const setBattleTypeStable = useMemo(() => {
    return (newType: BattleType) => {
      console.log(`🚨🚨🚨 [ENHANCED_RANKING_UI_STABLE] Battle type changing to: ${newType}`);
      setBattleType(newType);
      try {
        localStorage.setItem('pokemon-ranker-battle-type', newType);
      } catch (e) {
        console.warn('Failed to save battle type to localStorage:', e);
      }
    };
  }, []);

  return {
    battleType,
    setBattleType: setBattleTypeStable
  };
};
