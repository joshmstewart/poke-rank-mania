
import React from "react";
import { Trophy, DraftingCompass } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useTrueSkillStore } from "@/stores/trueskillStore";

interface ModeSwitcherProps {
  currentMode: "rank" | "battle";
  onModeChange: (mode: "rank" | "battle") => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { getAllRatings } = useTrueSkillStore();

  const handleModeChange = (mode: "rank" | "battle") => {
    console.error(`🚨🚨🚨 [MODE_SWITCH_ENTRY] ===== ENTERING handleModeChange =====`);
    console.error(`🚨 [MODE_SWITCH_ENTRY] Target mode: ${mode}, Current mode: ${currentMode}`);
    console.error(`🚨 [MODE_SWITCH_ENTRY] Call stack at entry:`, new Error().stack);
    
    // STEP 1: Check store state at very beginning
    const ratingsAtEntry = getAllRatings();
    console.error(`🚨 [MODE_SWITCH_STEP1] Store check at ENTRY: ${Object.keys(ratingsAtEntry).length} ratings`);
    
    // STEP 2: Check if this is the specific problematic switch (battle -> rank)
    if (currentMode === "battle" && mode === "rank") {
      console.error(`🚨🚨🚨 [MODE_SWITCH_CRITICAL_PATH] This is the battle->rank switch!`);
      console.error(`🚨 [MODE_SWITCH_CRITICAL_PATH] Store has ${Object.keys(ratingsAtEntry).length} ratings before any actions`);
    }
    
    // STEP 3: Call onModeChange and check store immediately after
    console.error(`🚨 [MODE_SWITCH_STEP3] About to call onModeChange(${mode})`);
    
    // Add a synchronous check right before the call
    const ratingsBeforeCall = getAllRatings();
    console.error(`🚨 [MODE_SWITCH_STEP3] Store check RIGHT BEFORE onModeChange: ${Object.keys(ratingsBeforeCall).length} ratings`);
    
    onModeChange(mode);
    
    // STEP 4: Check store immediately after onModeChange (synchronous)
    const ratingsAfterCall = getAllRatings();
    console.error(`🚨 [MODE_SWITCH_STEP4] Store check IMMEDIATELY AFTER onModeChange: ${Object.keys(ratingsAfterCall).length} ratings`);
    
    if (Object.keys(ratingsBeforeCall).length !== Object.keys(ratingsAfterCall).length) {
      console.error(`🚨🚨🚨 [MODE_SWITCH_SMOKING_GUN] STORE CLEARED BY onModeChange CALL!`);
      console.error(`🚨 [MODE_SWITCH_SMOKING_GUN] Before call: ${Object.keys(ratingsBeforeCall).length}, After call: ${Object.keys(ratingsAfterCall).length}`);
    }
    
    // STEP 5: Additional async checks
    setTimeout(() => {
      const ratingsAfter100ms = getAllRatings();
      console.error(`🚨 [MODE_SWITCH_STEP5] Store check after 100ms: ${Object.keys(ratingsAfter100ms).length} ratings`);
      
      if (Object.keys(ratingsAfterCall).length !== Object.keys(ratingsAfter100ms).length) {
        console.error(`🚨🚨🚨 [MODE_SWITCH_ASYNC_CLEAR] Store cleared by async operation!`);
      }
    }, 100);
    
    console.error(`🚨🚨🚨 [MODE_SWITCH_EXIT] ===== EXITING handleModeChange =====`);
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
