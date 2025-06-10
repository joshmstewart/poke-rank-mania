
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
    const debugId = `MODE_SWITCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔥🔥🔥 [${debugId}] ===== MODE SWITCH CLICKED =====`);
    console.log(`🔥🔥🔥 [${debugId}] From: ${currentMode} → To: ${mode}`);
    console.log(`🔥🔥🔥 [${debugId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔥🔥🔥 [${debugId}] Is hydrated: ${isHydrated}`);
    
    // DETAILED PENDING BATTLE ANALYSIS
    const pendingPokemon = getAllPendingIds();
    const hasPending = hasPendingPokemon;
    
    console.log(`🔥🔥🔥 [${debugId}] ===== PENDING BATTLE STATE ANALYSIS =====`);
    console.log(`🔥🔥🔥 [${debugId}] Pending Pokemon IDs:`, pendingPokemon);
    console.log(`🔥🔥🔥 [${debugId}] Count: ${pendingPokemon?.length || 0}`);
    console.log(`🔥🔥🔥 [${debugId}] Type: ${typeof pendingPokemon}`);
    console.log(`🔥🔥🔥 [${debugId}] Is Array: ${Array.isArray(pendingPokemon)}`);
    console.log(`🔥🔥🔥 [${debugId}] Has pending flag: ${hasPending}`);
    console.log(`🔥🔥🔥 [${debugId}] Is switching to battle: ${mode === "battle"}`);
    console.log(`🔥🔥🔥 [${debugId}] Should trigger event: ${mode === "battle" && Array.isArray(pendingPokemon) && pendingPokemon.length > 0}`);
    
    // Call the mode change first - this is critical for proper initialization
    console.log(`🔥🔥🔥 [${debugId}] Calling onModeChange(${mode})`);
    onModeChange(mode);
    console.log(`🔥🔥🔥 [${debugId}] onModeChange completed`);
    
    if (mode === "battle" && Array.isArray(pendingPokemon) && pendingPokemon.length > 0) {
      console.log(`🔥🔥🔥 [${debugId}] ⭐ SWITCHING TO BATTLE MODE WITH PENDING POKEMON!`);
      
      // Multiple timing attempts to ensure event is received
      const eventDetail = { 
        pendingPokemon: pendingPokemon,
        source: 'mode-switcher-cloud',
        timestamp: Date.now(),
        immediate: true,
        debugId: debugId
      };
      
      console.log(`🔥🔥🔥 [${debugId}] ===== DISPATCHING EVENTS =====`);
      console.log(`🔥🔥🔥 [${debugId}] Event detail:`, eventDetail);
      
      // Immediate dispatch
      console.log(`🔥🔥🔥 [${debugId}] Dispatching IMMEDIATE event`);
      const immediateEvent = new CustomEvent('pending-battles-detected', {
        detail: { ...eventDetail, timing: 'immediate' }
      });
      document.dispatchEvent(immediateEvent);
      
      // Short delay dispatch
      setTimeout(() => {
        console.log(`🔥🔥🔥 [${debugId}] Dispatching 100ms DELAYED event`);
        const delayedEvent = new CustomEvent('pending-battles-detected', {
          detail: { ...eventDetail, timing: '100ms-delay' }
        });
        document.dispatchEvent(delayedEvent);
      }, 100);
      
      // Medium delay dispatch
      setTimeout(() => {
        console.log(`🔥🔥🔥 [${debugId}] Dispatching 500ms DELAYED event`);
        const mediumDelayedEvent = new CustomEvent('pending-battles-detected', {
          detail: { ...eventDetail, timing: '500ms-delay' }
        });
        document.dispatchEvent(mediumDelayedEvent);
      }, 500);
      
      // Long delay dispatch
      setTimeout(() => {
        console.log(`🔥🔥🔥 [${debugId}] Dispatching 1000ms DELAYED event`);
        const longDelayedEvent = new CustomEvent('pending-battles-detected', {
          detail: { ...eventDetail, timing: '1000ms-delay' }
        });
        document.dispatchEvent(longDelayedEvent);
      }, 1000);
      
      console.log(`🔥🔥🔥 [${debugId}] ✅ All events dispatched`);
      return;
    }
    
    console.log(`🔥🔥🔥 [${debugId}] Normal mode switch - no pending Pokemon or not switching to battle`);
    console.log(`🔥🔥🔥 [${debugId}] Conditions: mode=${mode}, pendingPokemon=${JSON.stringify(pendingPokemon)}, isArray=${Array.isArray(pendingPokemon)}, length=${pendingPokemon?.length}`);
  };

  // Debug render
  const currentPending = getAllPendingIds();
  console.log(`🔥🔥🔥 [MODE_SWITCHER_RENDER] ModeSwitcher render:`, {
    currentMode,
    hasPendingPokemon,
    pendingCount: currentPending?.length || 0,
    pendingIds: currentPending,
    pendingType: typeof currentPending,
    pendingIsArray: Array.isArray(currentPending),
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
