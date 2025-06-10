
import React from "react";
import { Trophy, DraftingCompass } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { usePersistentPendingState } from "@/hooks/battle/usePersistentPendingState";

interface ModeSwitcherProps {
  currentMode: "rank" | "battle";
  onModeChange: (mode: "rank" | "battle") => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { getAllPendingIds, hasPendingPokemon } = usePersistentPendingState();

  const handleModeChange = (mode: "rank" | "battle") => {
    console.log(`🔍 [MODE_SWITCH_TRACE] ===== MODE SWITCH BUTTON CLICKED =====`);
    console.log(`🔍 [MODE_SWITCH_TRACE] From: ${currentMode} → To: ${mode}`);
    console.log(`🔍 [MODE_SWITCH_TRACE] Timestamp: ${new Date().toISOString()}`);
    
    // Get pending Pokemon from persistent state
    const pendingPokemon = getAllPendingIds();
    console.log(`🔍 [MODE_SWITCH_TRACE] ✅ Found ${pendingPokemon.length} pending Pokemon:`, pendingPokemon);
    
    if (mode === "battle" && hasPendingPokemon) {
      console.log(`🔍 [MODE_SWITCH_TRACE] ⭐ SWITCHING TO BATTLE MODE WITH PENDING POKEMON!`);
      
      // Call the mode change first
      onModeChange(mode);
      
      // Dispatch event to notify battle system
      setTimeout(() => {
        const event = new CustomEvent('pending-battles-detected', {
          detail: { 
            pendingPokemon: pendingPokemon,
            source: 'mode-switcher-persistent',
            timestamp: Date.now()
          }
        });
        document.dispatchEvent(event);
        console.log(`🔍 [MODE_SWITCH_TRACE] ✅ Dispatched pending-battles-detected event`);
      }, 100);
      
      return;
    }
    
    console.log(`🔍 [MODE_SWITCH_TRACE] Normal mode switch, no pending Pokemon`);
    onModeChange(mode);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <div className="bg-white border border-gray-200 p-1 rounded-lg flex items-center shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleModeChange("battle")}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm relative ${
                  currentMode === "battle"
                    ? "bg-blue-900 text-white shadow-sm"
                    : "hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                }`}
                aria-label="Battle Mode"
              >
                <Trophy className={`h-4 w-4 ${currentMode === "battle" ? "text-white" : "text-blue-900"}`} />
                <span>Battle</span>
                {hasPendingPokemon && currentMode !== "battle" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              <p>Battle Mode: Compare Pokémon head-to-head</p>
              {hasPendingPokemon && <p className="text-yellow-400">⭐ Pending battles available!</p>}
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
