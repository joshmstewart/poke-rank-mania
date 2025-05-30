
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
    console.log(`🔄 [MODE_SWITCH_DEBUG] Switching from ${currentMode} to ${mode}`);
    
    // CRITICAL DEBUG: Check store before mode change
    const ratingsBeforeSwitch = getAllRatings();
    console.error(`🚨 [MODE_SWITCH_CRITICAL] BEFORE switch to ${mode}: Store has ${Object.keys(ratingsBeforeSwitch).length} ratings`);
    console.error(`🚨 [MODE_SWITCH_CRITICAL] Call stack at mode switch:`, new Error().stack);
    
    onModeChange(mode);
    
    // CRITICAL DEBUG: Check store after mode change (with delay)
    setTimeout(() => {
      const ratingsAfterSwitch = getAllRatings();
      console.error(`🚨 [MODE_SWITCH_CRITICAL] AFTER switch to ${mode}: Store has ${Object.keys(ratingsAfterSwitch).length} ratings`);
      
      if (Object.keys(ratingsBeforeSwitch).length !== Object.keys(ratingsAfterSwitch).length) {
        console.error(`🚨🚨🚨 [MODE_SWITCH_CRITICAL] RATING COUNT CHANGED DURING MODE SWITCH!`);
        console.error(`🚨 [MODE_SWITCH_CRITICAL] Before: ${Object.keys(ratingsBeforeSwitch).length}, After: ${Object.keys(ratingsAfterSwitch).length}`);
      }
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
