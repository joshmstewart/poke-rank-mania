
import React from "react";
import { Trophy, DraftingCompass } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface ModeSwitcherProps {
  currentMode: "rank" | "battle";
  onModeChange: (mode: "rank" | "battle") => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const handleModeChange = (mode: "rank" | "battle") => {
    console.log(`⚡⚡⚡ [IMMEDIATE_MODE_SWITCH] ===== MODE SWITCH BUTTON CLICKED =====`);
    console.log(`⚡⚡⚡ [IMMEDIATE_MODE_SWITCH] From: ${currentMode} → To: ${mode}`);
    console.log(`⚡⚡⚡ [IMMEDIATE_MODE_SWITCH] Timestamp: ${new Date().toISOString()}`);
    
    // Check localStorage for any pending Pokemon
    const pendingPokemon = [];
    for (let i = 1; i <= 1000; i++) {
      const stored = localStorage.getItem(`pokemon-pending-${i}`);
      if (stored === 'true') {
        pendingPokemon.push(i);
      }
    }
    
    console.log(`⚡⚡⚡ [IMMEDIATE_MODE_SWITCH] Found ${pendingPokemon.length} pending Pokemon:`, pendingPokemon);
    
    if (mode === "battle" && pendingPokemon.length > 0) {
      console.log(`⚡⚡⚡ [IMMEDIATE_MODE_SWITCH] ⭐ SWITCHING TO BATTLE MODE WITH PENDING POKEMON!`);
      
      // Call the mode change first
      onModeChange(mode);
      
      // Dispatch event to notify battle system
      setTimeout(() => {
        const event = new CustomEvent('pending-battles-detected', {
          detail: { 
            pendingPokemon: pendingPokemon,
            source: 'mode-switcher',
            timestamp: Date.now()
          }
        });
        document.dispatchEvent(event);
        console.log(`⚡⚡⚡ [IMMEDIATE_MODE_SWITCH] Dispatched pending-battles-detected event`);
      }, 100);
      
      return;
    }
    
    console.log(`⚡⚡⚡ [IMMEDIATE_MODE_SWITCH] Normal mode switch, no pending Pokemon`);
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
