
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
    
    console.log(`🚨 [MODE_SWITCHER_CRITICAL] ===== MODE SWITCHER BUTTON CLICKED =====`);
    console.log(`🚨 [MODE_SWITCHER_CRITICAL] From: ${currentMode} → To: ${mode}`);
    console.log(`🚨 [MODE_SWITCHER_CRITICAL] Store state BEFORE switcher action: ${ratingsCountBefore} ratings`);
    console.log(`🚨 [MODE_SWITCHER_CRITICAL] Rating IDs: ${Object.keys(ratingsBefore).slice(0, 10).join(', ')}${Object.keys(ratingsBefore).length > 10 ? '...' : ''}`);
    
    // CRITICAL FIX: Check refinement queue before switching modes
    if (refinementQueueHook) {
      const hasRefinementBattles = refinementQueueHook.hasRefinementBattles;
      const refinementCount = refinementQueueHook.refinementBattleCount;
      console.log(`🚨 [MODE_SWITCHER_CRITICAL] Refinement queue status: ${hasRefinementBattles ? 'HAS' : 'NO'} battles (${refinementCount} total)`);
      
      if (mode === "battle" && hasRefinementBattles) {
        console.log(`🚨 [MODE_SWITCHER_CRITICAL] ⭐ SWITCHING TO BATTLE MODE WITH QUEUED REFINEMENT BATTLES!`);
        console.log(`🚨 [MODE_SWITCHER_CRITICAL] This should trigger refinement battles in battle mode`);
        
        // Call the mode change first to ensure battle system is mounted
        onModeChange(mode);
        
        // CRITICAL FIX: Dispatch event with longer delay to ensure battle system is ready
        setTimeout(() => {
          const event = new CustomEvent('refinement-battles-available', {
            detail: { 
              count: refinementCount,
              source: 'mode-switcher',
              timestamp: Date.now()
            }
          });
          document.dispatchEvent(event);
          console.log(`🚨 [MODE_SWITCHER_CRITICAL] ✅ Dispatched refinement-battles-available event after mode switch`);
        }, 1000); // Increased delay to ensure battle system is mounted
        
        // Exit early since we already called onModeChange
        return;
      }
    }
    
    // Call the mode change for non-battle switches or when no refinement battles
    onModeChange(mode);
    
    // Check ratings after mode change (with delay to allow state updates)
    setTimeout(() => {
      const ratingsAfter = getAllRatings();
      const ratingsCountAfter = Object.keys(ratingsAfter).length;
      
      console.log(`🚨 [MODE_SWITCHER_CRITICAL] Store state AFTER switcher action: ${ratingsCountAfter} ratings`);
      
      if (ratingsCountBefore !== ratingsCountAfter) {
        console.log(`🚨 [MODE_SWITCHER_CRITICAL] ❌ RATING COUNT CHANGED! ${ratingsCountBefore} → ${ratingsCountAfter}`);
        console.log(`🚨 [MODE_SWITCHER_CRITICAL] This indicates data loss during mode switch!`);
      } else {
        console.log(`🚨 [MODE_SWITCHER_CRITICAL] ✅ Rating count preserved during mode switch`);
      }
      console.log(`🚨 [MODE_SWITCHER_CRITICAL] ===== MODE SWITCHER ACTION COMPLETE =====`);
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
