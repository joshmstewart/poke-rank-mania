
import React from "react";
import { Trophy, DraftingCompass } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { useSharedRefinementQueue } from "@/hooks/battle/useSharedRefinementQueue";

interface ModeSwitcherProps {
  currentMode: "rank" | "battle";
  onModeChange: (mode: "rank" | "battle") => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { getAllRatings } = useTrueSkillStore();
  const refinementQueueHook = useSharedRefinementQueue();

  const handleModeChange = (mode: "rank" | "battle") => {
    const ratingsBefore = getAllRatings();
    const ratingsCountBefore = Object.keys(ratingsBefore).length;
    
    console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ===== MODE SWITCHER BUTTON CLICKED =====`);
    console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] Timestamp: ${new Date().toISOString()}`);
    console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] From: ${currentMode} → To: ${mode}`);
    console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] Store state BEFORE switcher action: ${ratingsCountBefore} ratings`);
    console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] Rating IDs sample: ${Object.keys(ratingsBefore).slice(0, 10).join(', ')}${Object.keys(ratingsBefore).length > 10 ? '...' : ''}`);
    
    // CRITICAL DEBUG: Check refinement queue before switching modes
    if (refinementQueueHook) {
      const hasRefinementBattles = refinementQueueHook.hasRefinementBattles;
      const refinementCount = refinementQueueHook.refinementBattleCount;
      const queueLength = refinementQueueHook.refinementQueue?.length || 0;
      
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] 📊 Refinement queue status:`);
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] - hasRefinementBattles: ${hasRefinementBattles}`);
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] - refinementCount: ${refinementCount}`);
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] - queueLength: ${queueLength}`);
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] - actual queue contents:`, refinementQueueHook.refinementQueue);
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] - refinementQueueHook functions:`, {
        queueBattlesForReorder: typeof refinementQueueHook.queueBattlesForReorder,
        getNextRefinementBattle: typeof refinementQueueHook.getNextRefinementBattle,
        popRefinementBattle: typeof refinementQueueHook.popRefinementBattle
      });
      
      // Check localStorage for pending Pokemon
      const pendingPokemon = [];
      for (let i = 1; i <= 1000; i++) {
        const stored = localStorage.getItem(`pokemon-pending-${i}`);
        if (stored === 'true') {
          pendingPokemon.push(i);
        }
      }
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] - pending Pokemon in localStorage:`, pendingPokemon);
      
      if (mode === "battle" && (hasRefinementBattles || pendingPokemon.length > 0)) {
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ⭐ SWITCHING TO BATTLE MODE WITH QUEUED REFINEMENT BATTLES!`);
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] Queue battles: ${hasRefinementBattles}, Pending localStorage: ${pendingPokemon.length}`);
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] This should trigger refinement battles in battle mode`);
        
        // Call the mode change first to ensure battle system is mounted
        onModeChange(mode);
        
        // Dispatch event with detailed information
        setTimeout(() => {
          const event = new CustomEvent('refinement-battles-available', {
            detail: { 
              count: refinementCount || pendingPokemon.length,
              source: 'mode-switcher',
              timestamp: Date.now(),
              queueLength: queueLength,
              pendingPokemon: pendingPokemon,
              hasQueuedBattles: hasRefinementBattles,
              actualQueue: refinementQueueHook.refinementQueue
            }
          });
          document.dispatchEvent(event);
          console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ✅ Dispatched refinement-battles-available event after mode switch`);
          console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] Event detail:`, event.detail);
        }, 1000);
        
        // Exit early since we already called onModeChange
        return;
      } else if (mode === "battle") {
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ⚠️ Switching to battle mode but NO refinement battles queued`);
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] Will proceed with normal mode switch`);
      }
    } else {
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ❌ No refinement queue hook available!`);
    }
    
    // Call the mode change for non-battle switches or when no refinement battles
    onModeChange(mode);
    
    // Check ratings after mode change (with delay to allow state updates)
    setTimeout(() => {
      const ratingsAfter = getAllRatings();
      const ratingsCountAfter = Object.keys(ratingsAfter).length;
      
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] Store state AFTER switcher action: ${ratingsCountAfter} ratings`);
      
      if (ratingsCountBefore !== ratingsCountAfter) {
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ❌ RATING COUNT CHANGED! ${ratingsCountBefore} → ${ratingsCountAfter}`);
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] This indicates data loss during mode switch!`);
      } else {
        console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ✅ Rating count preserved during mode switch`);
      }
      console.log(`🚨🔥🔥 [MODE_SWITCHER_ULTIMATE_DEBUG] ===== MODE SWITCHER ACTION COMPLETE =====`);
    }, 100);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <div className="bg-white border border-gray-200 p-1 rounded-lg flex items-center shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleModeChange("battle")}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm ${
                  currentMode === "battle"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                }`}
                aria-label="Battle Mode"
              >
                <Trophy className={`h-4 w-4 ${currentMode === "battle" ? "text-white" : "text-blue-900"}`} />
                <span>Battle</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              <p>Battle Mode: Compare Pokémon head-to-head</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleModeChange("rank")}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm ${
                  currentMode === "rank"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                }`}
                aria-label="Manual Mode"
              >
                <DraftingCompass className={`h-4 w-4 ${currentMode === "rank" ? "text-white" : "text-blue-900"}`} />
                <span>Manual</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              <p>Manual Mode: Drag and reorder rankings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ModeSwitcher;
