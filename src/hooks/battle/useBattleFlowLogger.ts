
import { useEffect } from "react";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleFlowLogger = () => {
  const { 
    getAllRatings, 
    getAllPendingBattles, 
    totalBattles,
    isHydrated 
  } = useTrueSkillStore();

  // Log complete store state every few seconds for debugging
  useEffect(() => {
    const logInterval = setInterval(() => {
      const ratings = getAllRatings();
      const pending = getAllPendingBattles();
      const ratingCount = Object.keys(ratings).length;
      
      console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] ===== PERIODIC STATE LOG =====`);
      console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] Timestamp: ${new Date().toISOString()}`);
      console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] Is Hydrated: ${isHydrated}`);
      console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] Total Battles: ${totalBattles}`);
      console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] Ratings Count: ${ratingCount}`);
      console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] Pending Battles: ${pending.length}`);
      
      if (ratingCount > 0 && ratingCount <= 10) {
        console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] Sample Ratings:`, Object.entries(ratings).slice(0, 5).map(([id, rating]) => 
          `ID:${id} μ:${rating.mu.toFixed(2)} σ:${rating.sigma.toFixed(2)} battles:${rating.battleCount}`
        ));
      }
      
      if (pending.length > 0 && pending.length <= 10) {
        console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] Pending Pokemon IDs:`, pending);
      }
      
      console.log(`📊📊📊 [BATTLE_FLOW_LOGGER] ===== END PERIODIC LOG =====`);
    }, 10000); // Log every 10 seconds

    return () => clearInterval(logInterval);
  }, [getAllRatings, getAllPendingBattles, totalBattles, isHydrated]);

  // Log store changes when they happen
  const logStoreChange = (action: string, details?: any) => {
    const ratings = getAllRatings();
    const pending = getAllPendingBattles();
    
    console.log(`🔄🔄🔄 [STORE_CHANGE] ===== ${action.toUpperCase()} =====`);
    console.log(`🔄🔄🔄 [STORE_CHANGE] Action: ${action}`);
    console.log(`🔄🔄🔄 [STORE_CHANGE] Details:`, details);
    console.log(`🔄🔄🔄 [STORE_CHANGE] Current State:`);
    console.log(`🔄🔄🔄 [STORE_CHANGE] - Ratings: ${Object.keys(ratings).length}`);
    console.log(`🔄🔄🔄 [STORE_CHANGE] - Pending: ${pending.length}`);
    console.log(`🔄🔄🔄 [STORE_CHANGE] - Total Battles: ${totalBattles}`);
    console.log(`🔄🔄🔄 [STORE_CHANGE] ===== END ${action.toUpperCase()} =====`);
  };

  return { logStoreChange };
};
