
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
    console.log(`🔍 [MODE_DEBUG] ===== MODE SWITCH CLICKED =====`);
    console.log(`🔍 [MODE_DEBUG] From: ${currentMode} → To: ${mode}`);
    console.log(`🔍 [MODE_DEBUG] Timestamp: ${new Date().toISOString()}`);
    
    // Always get fresh pending data
    const pendingPokemon = getAllPendingIds();
    const hasPending = hasPendingPokemon;
    
    console.log(`🔍 [MODE_DEBUG] Fresh pending check:`, {
      pendingPokemon: pendingPokemon,
      count: pendingPokemon.length,
      hasPending: hasPending
    });
    
    if (mode === "battle" && hasPending) {
      console.log(`🔍 [MODE_DEBUG] ⭐ SWITCHING TO BATTLE MODE WITH PENDING POKEMON!`);
      
      // Call the mode change first
      onModeChange(mode);
      
      // Dispatch event to notify battle system
      setTimeout(() => {
        const eventDetail = { 
          pendingPokemon: pendingPokemon,
          source: 'mode-switcher-persistent',
          timestamp: Date.now()
        };
        
        console.log(`🔍 [MODE_DEBUG] ===== DISPATCHING EVENT =====`);
        console.log(`🔍 [MODE_DEBUG] Event detail:`, eventDetail);
        
        const event = new CustomEvent('pending-battles-detected', {
          detail: eventDetail
        });
        document.dispatchEvent(event);
        console.log(`🔍 [MODE_DEBUG] ✅ Event dispatched successfully`);
      }, 100);
      
      return;
    }
    
    console.log(`🔍 [MODE_DEBUG] Normal mode switch - no pending Pokemon or not switching to battle`);
    onModeChange(mode);
  };

  // Debug render
  console.log(`🔍 [MODE_DEBUG] ModeSwitcher render:`, {
    currentMode,
    hasPendingPokemon,
    pendingCount: getAllPendingIds().length
  });

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
