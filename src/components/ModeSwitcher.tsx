
import React from "react";
import { Trophy, DraftingCompass } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useCloudPendingBattles } from "@/hooks/battle/useCloudPendingBattles";
import { useTrueSkillStore } from "@/stores/trueskillStore";

interface ModeSwitcherProps {
  currentMode: "rank" | "battle";
  onModeChange: (mode: "rank" | "battle") => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  const { getAllPendingIds, hasPendingPokemon, isHydrated } = useCloudPendingBattles();
  const { setInitiatePendingBattle } = useTrueSkillStore();

  const handleBattleClick = () => {
    console.log(`🚨 BATTLE BUTTON CLICKED! Current mode: ${currentMode}`);
    handleModeChange("battle");
  };

  const handleRankClick = () => {
    console.log(`🚨 RANK BUTTON CLICKED! Current mode: ${currentMode}`);
    handleModeChange("rank");
  };

  const handleModeChange = (mode: "rank" | "battle") => {
    const debugId = `MODE_SWITCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥 [${debugId}] ===== MODE SWITCH CLICKED =====`);
    console.log(`🔥 [${debugId}] From: ${currentMode} → To: ${mode}`);
    
    // Check for pending Pokemon before mode change
    const pendingPokemon = getAllPendingIds();
    const hasPending = Array.isArray(pendingPokemon) && pendingPokemon.length > 0;
    
    console.log(`🔥 [${debugId}] Pending Pokemon:`, pendingPokemon);
    console.log(`🔥 [${debugId}] Has pending: ${hasPending}`);
    
    // ROBUST FIX: Use flag-based coordination instead of timed events
    if (mode === "battle" && hasPending) {
      console.log(`🚦 [${debugId}] Setting initiatePendingBattle flag for robust coordination`);
      setInitiatePendingBattle(true);
    }
    
    // Call the mode change
    console.log(`🔥 [${debugId}] Calling onModeChange(${mode})`);
    onModeChange(mode);
    
    console.log(`🔥 [${debugId}] Mode switch completed`);
  };

  // Debug render
  const currentPending = getAllPendingIds();
  console.log(`🔥 [MODE_SWITCHER_RENDER] ModeSwitcher render:`, {
    currentMode,
    hasPendingPokemon,
    pendingCount: currentPending?.length || 0,
    pendingIds: currentPending,
    isHydrated,
    timestamp: new Date().toISOString()
  });

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <div className="bg-white border border-gray-200 p-1 rounded-lg flex items-center shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleBattleClick}
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
                onClick={handleRankClick}
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
