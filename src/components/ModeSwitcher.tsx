
import React from "react";
import { Trophy, DraftingCompass } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useCloudPendingBattles } from "@/hooks/battle/useCloudPendingBattles";

interface ModeSwitcherProps {
  currentMode: "rank" | "battle";
  onModeChange: (mode: "rank" | "battle") => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { getAllPendingIds, hasPendingPokemon, isHydrated } = useCloudPendingBattles();

  const handleModeChange = (mode: "rank" | "battle") => {
    console.log(`🌥️ [MODE_DEBUG] ===== MODE SWITCH CLICKED =====`);
    console.log(`🌥️ [MODE_DEBUG] From: ${currentMode} → To: ${mode}`);
    console.log(`🌥️ [MODE_DEBUG] Timestamp: ${new Date().toISOString()}`);
    console.log(`🌥️ [MODE_DEBUG] Is hydrated: ${isHydrated}`);
    
    // Always get fresh pending data
    const pendingPokemon = getAllPendingIds();
    const hasPending = hasPendingPokemon;
    
    console.log(`🌥️ [MODE_DEBUG] Fresh pending check:`, {
      pendingPokemon: pendingPokemon,
      count: pendingPokemon.length,
      hasPending: hasPending
    });
    
    // Call the mode change first - this is critical for proper initialization
    onModeChange(mode);
    
    if (mode === "battle" && hasPending) {
      console.log(`🌥️ [MODE_DEBUG] ⭐ SWITCHING TO BATTLE MODE WITH PENDING POKEMON!`);
      
      // CRITICAL FIX: Dispatch event AFTER mode change with actual pending data
      setTimeout(() => {
        const eventDetail = { 
          pendingPokemon: pendingPokemon,
          source: 'mode-switcher-cloud',
          timestamp: Date.now(),
          immediate: true // Flag to indicate this should be processed immediately
        };
        
        console.log(`🌥️ [MODE_DEBUG] ===== DISPATCHING EVENT AFTER MODE CHANGE =====`);
        console.log(`🌥️ [MODE_DEBUG] Event detail:`, eventDetail);
        
        const event = new CustomEvent('pending-battles-detected', {
          detail: eventDetail
        });
        document.dispatchEvent(event);
        console.log(`🌥️ [MODE_DEBUG] ✅ Event dispatched successfully after mode change`);
      }, 200); // Increased delay to ensure battle mode is fully loaded
      
      return;
    }
    
    console.log(`🌥️ [MODE_DEBUG] Normal mode switch - no pending Pokemon or not switching to battle`);
  };

  // Debug render
  console.log(`🌥️ [MODE_DEBUG] ModeSwitcher render:`, {
    currentMode,
    hasPendingPokemon,
    pendingCount: getAllPendingIds().length,
    isHydrated
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
