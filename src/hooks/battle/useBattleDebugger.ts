
import { useEffect } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';

export const useBattleDebugger = () => {
  const { totalBattles, getAllRatings, sessionId, isHydrated } = useTrueSkillStore();

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🐛 [BATTLE_DEBUGGER] ===== DEBUG INFO =====');
      console.log('🐛 [BATTLE_DEBUGGER] TrueSkill Store State:');
      console.log(`🐛 [BATTLE_DEBUGGER] - isHydrated: ${isHydrated}`);
      console.log(`🐛 [BATTLE_DEBUGGER] - sessionId: ${sessionId}`);
      console.log(`🐛 [BATTLE_DEBUGGER] - totalBattles: ${totalBattles}`);
      
      const allRatings = getAllRatings();
      const ratedPokemonCount = Object.keys(allRatings).length;
      console.log(`🐛 [BATTLE_DEBUGGER] - ratedPokemon: ${ratedPokemonCount}`);
      
      // Check localStorage directly
      try {
        const localStorage = window.localStorage;
        const trueskillData = localStorage.getItem('trueskill-storage');
        if (trueskillData) {
          const parsed = JSON.parse(trueskillData);
          console.log('🐛 [BATTLE_DEBUGGER] localStorage data:');
          console.log(`🐛 [BATTLE_DEBUGGER] - totalBattles in localStorage: ${parsed.state?.totalBattles || 'NOT FOUND'}`);
          console.log(`🐛 [BATTLE_DEBUGGER] - ratings count in localStorage: ${Object.keys(parsed.state?.ratings || {}).length}`);
        } else {
          console.log('🐛 [BATTLE_DEBUGGER] ❌ No trueskill-storage found in localStorage');
        }
      } catch (error) {
        console.error('🐛 [BATTLE_DEBUGGER] ❌ Error checking localStorage:', error);
      }
      
      console.log('🐛 [BATTLE_DEBUGGER] ========================');
    }, 5000); // Log every 5 seconds

    return () => clearInterval(interval);
  }, [totalBattles, getAllRatings, sessionId, isHydrated]);

  const manualDebugCheck = () => {
    console.log('🔍 [MANUAL_DEBUG] ===== MANUAL DEBUG CHECK =====');
    
    // Check all localStorage keys
    const localStorage = window.localStorage;
    console.log('🔍 [MANUAL_DEBUG] All localStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`🔍 [MANUAL_DEBUG] - ${key}: ${value?.substring(0, 100)}...`);
      }
    }
    
    console.log('🔍 [MANUAL_DEBUG] ================================');
  };

  return {
    manualDebugCheck
  };
};
