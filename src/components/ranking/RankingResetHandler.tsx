
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { toast } from "@/hooks/use-toast";

interface RankingResetHandlerProps {
  onReset: () => void;
  setRankedPokemon: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useRankingReset = ({ onReset, setRankedPokemon }: RankingResetHandlerProps) => {
  const { clearAllRatings } = useTrueSkillStore();

  // COMPREHENSIVE RESET: Same as Battle Mode
  const handleComprehensiveReset = () => {
    const timestamp = new Date().toISOString();
    
    console.log(`🔄 [COMPREHENSIVE_RESET] ===== COMPREHENSIVE RESTART INITIATED =====`);
    console.log(`🔄 [COMPREHENSIVE_RESET] Timestamp: ${timestamp}`);
    
    // Step 1: Clear TrueSkill store first (this affects both modes)
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 1: Clearing TrueSkill store`);
    clearAllRatings();
    
    // Step 2: Clear all localStorage items
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 2: Clearing localStorage`);
    const keysToRemove = [
      'pokemon-active-suggestions',
      'pokemon-battle-count',
      'pokemon-battle-results',
      'pokemon-battle-tracking',
      'pokemon-battle-history',
      'pokemon-battles-completed',
      'pokemon-battle-seen',
      'suggestionUsageCounts',
      'pokemon-ranker-rankings',
      'pokemon-ranker-confidence'
    ];
    
    // Also clear generation-specific manual rankings
    for (let gen = 0; gen <= 9; gen++) {
      keysToRemove.push(`manual-rankings-gen-${gen}`);
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔄 [COMPREHENSIVE_RESET] Cleared: ${key}`);
    });
    
    // Step 3: Reset parent React state (but Manual mode will use TrueSkill)
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 3: Resetting parent state`);
    setRankedPokemon([]);
    
    // Step 4: Call the original reset from the parent
    onReset();
    
    // Step 5: Dispatch events to notify other components
    console.log(`🔄 [COMPREHENSIVE_RESET] Step 5: Dispatching reset events`);
    setTimeout(() => {
      // Notify both modes
      const manualModeEvent = new CustomEvent('trueskill-store-cleared');
      document.dispatchEvent(manualModeEvent);
      
      // General reset event
      const resetEvent = new CustomEvent('battle-system-reset', {
        detail: { timestamp, source: 'manual-mode-restart' }
      });
      document.dispatchEvent(resetEvent);
      
      console.log(`🔄 [COMPREHENSIVE_RESET] ✅ Events dispatched`);
    }, 50);
    
    // Step 6: Show success toast
    toast({
      title: "Complete Reset",
      description: "All battles, rankings, and progress have been completely reset across both modes.",
      duration: 3000
    });
    
    console.log(`🔄 [COMPREHENSIVE_RESET] ===== COMPREHENSIVE RESET COMPLETE =====`);
  };

  return { handleComprehensiveReset };
};
