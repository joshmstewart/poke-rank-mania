
import { useCallback, useState, useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { useBattleNavigation } from "./useBattleNavigation";
import { toast } from "sonner";

export const useBattleInteractions = (
  currentBattle: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  selectedPokemon: number[],
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  battleHistory: { battle: Pokemon[], selected: number[] }[],
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  onBattleComplete: (battleType: BattleType, currentBattle: Pokemon[]) => void,
  onGoBack: () => void,
  battleType: BattleType,
  processBattleResult: (selectedPokemonIds: number[], currentBattlePokemon: Pokemon[], battleType: BattleType, currentSelectedGeneration?: number) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickDebounceRef = useRef<boolean>(false);
  const processingStateRef = useRef<boolean>(false);

  // LOADING CIRCLES DEBUG: Enhanced logging for useBattleInteractions
  useEffect(() => {
    console.log(`🔄 [LOADING CIRCLES DEBUG] useBattleInteractions isProcessing changed:`, {
      isProcessing,
      processingStateRef: processingStateRef.current,
      timestamp: new Date().toISOString(),
      source: 'useBattleInteractions'
    });
    
    if (isProcessing) {
      console.log(`🟡 [LOADING CIRCLES] useBattleInteractions CONTRIBUTING to loading circles - isProcessing: true`);
    } else {
      console.log(`🟢 [LOADING CIRCLES] useBattleInteractions NOT contributing to loading circles - isProcessing: false`);
    }
  }, [isProcessing]);

  const { goBack: navigationGoBack } = useBattleNavigation(
    battleHistory,
    setBattleHistory,
    battleResults,
    setBattleResults,
    battlesCompleted,
    setBattlesCompleted,
    () => {},
    setSelectedPokemon
  );

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        console.log(`🧹 [LOADING CIRCLES] useBattleInteractions: Clearing processing timeout on cleanup`);
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log("🔄 Resetting selected pokemon due to battle change or type change");
    setSelectedPokemon([]);
    setLastSelectedId(null);
    console.log(`🔄 [LOADING CIRCLES] useBattleInteractions: Resetting processing states due to battle/type change`);
    setIsProcessing(false);
    processingStateRef.current = false;
    
    if (processingTimeoutRef.current) {
      console.log(`🧹 [LOADING CIRCLES] useBattleInteractions: Clearing processing timeout due to battle/type change`);
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, [battleType, setSelectedPokemon, currentBattle]);

  useEffect(() => {
    const handleMilestoneDismissed = () => {
      console.log("📣 useBattleInteractions: Received milestone-dismissed event");
      
      console.log(`🔄 [LOADING CIRCLES] useBattleInteractions: Milestone dismissed - resetting processing states`);
      setIsProcessing(false);
      processingStateRef.current = false;
      
      if (processingTimeoutRef.current) {
        console.log(`🧹 [LOADING CIRCLES] useBattleInteractions: Clearing processing timeout due to milestone dismiss`);
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
    
    document.addEventListener('milestone-dismissed', handleMilestoneDismissed);
    
    return () => {
      document.removeEventListener('milestone-dismissed', handleMilestoneDismissed);
    };
  }, []);

  const handlePokemonSelect = useCallback(
    (id: number) => {
      console.log(`🖱️ [LOADING CIRCLES DEBUG] useBattleInteractions handlePokemonSelect called:`, {
        id,
        isProcessing,
        processingStateRef: processingStateRef.current,
        clickDebounce: clickDebounceRef.current,
        timestamp: new Date().toISOString()
      });
      
      if (!currentBattle || currentBattle.length === 0) {
        console.warn("🚫 handlePokemonSelect called with empty battle");
        return;
      }
      
      if (isProcessing || processingStateRef.current) {
        console.log("🛑 [LOADING CIRCLES] useBattleInteractions: Processing in progress, ignoring click");
        toast.info("Please wait...", {
          description: "Processing current selection"
        });
        return;
      }
      
      if (clickDebounceRef.current) {
        console.log(`🛑 Ignoring rapid click on Pokemon ID: ${id} (debounce active)`);
        return;
      }
      
      clickDebounceRef.current = true;
      setTimeout(() => {
        clickDebounceRef.current = false;
      }, 800);
      
      if (lastSelectedId === id && battleType === "pairs") {
        console.log(`🔄 Ignoring duplicate selection of Pokemon ID: ${id}`);
        return;
      }
      
      console.log(`👆 handlePokemonSelect: Selected Pokemon ID: ${id} for ${battleType} battle`);
      
      console.log(`🔄 [LOADING CIRCLES] useBattleInteractions: Setting processing states to true for selection ${id}`);
      setIsProcessing(true);
      processingStateRef.current = true;
      
      let updatedSelected: number[] = [];
      
      if (battleType === "pairs") {
        updatedSelected = [id];
        console.log(`🛠️ [PAIR BATTLE] Setting selection to: [${id}]`);
      } else {
        if (selectedPokemon.length >= 2) {
          updatedSelected = [id];
        } else {
          updatedSelected = [...selectedPokemon, id];
        }
      }

      setLastSelectedId(id);
      setSelectedPokemon(updatedSelected);
      
      console.log(`🎮 handlePokemonSelect: Updated selection to [${updatedSelected.join(', ')}] for ${battleType} battle`);

      if (battleType === "pairs") {
        const currentBattleCopy = [...currentBattle];
        
        const updatedHistory = [
          ...battleHistory,
          { battle: currentBattleCopy, selected: updatedSelected }
        ];
        setBattleHistory(updatedHistory);
        console.log("🔄 Updating battle history. New length:", updatedHistory.length);
        
        if (processingTimeoutRef.current) {
          console.log(`🧹 [LOADING CIRCLES] useBattleInteractions: Clearing existing processing timeout`);
          clearTimeout(processingTimeoutRef.current);
        }
        
        processingTimeoutRef.current = setTimeout(() => {
          try {
            console.log(`[DEBUG useBattleInteractions] Processing battle result for:`, updatedSelected);
            
            const selectedPokemon = currentBattleCopy.find(p => p.id === id);
            if (selectedPokemon) {
              toast.success(`Selected ${selectedPokemon.name}`, {
                duration: 700
              });
            }
            
            processBattleResult(updatedSelected, currentBattleCopy, battleType);
            console.log("✅ useBattleInteractions: Battle processed successfully");
          } catch (e) {
            console.error("❌ Error processing battle:", e);
            console.log(`🔄 [LOADING CIRCLES] useBattleInteractions: Error - resetting processing states`);
            setIsProcessing(false);
            processingStateRef.current = false;
            toast.error("Battle processing error", {
              description: "There was a problem processing your selection"
            });
          } finally {
            processingTimeoutRef.current = null;
          }
        }, 600);
      }
    },
    [
      battleHistory,
      battleType,
      currentBattle,
      processBattleResult,
      selectedPokemon,
      setBattleHistory,
      setSelectedPokemon,
      isProcessing,
      lastSelectedId
    ]
  );

  const handleGoBack = useCallback(() => {
    console.log("useBattleInteractions: Handling go back");
    
    console.log(`🔄 [LOADING CIRCLES] useBattleInteractions handleGoBack: Clearing processing states`);
    setIsProcessing(false);
    processingStateRef.current = false;
    
    if (processingTimeoutRef.current) {
      console.log(`🧹 [LOADING CIRCLES] useBattleInteractions handleGoBack: Clearing processing timeout`);
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    navigationGoBack(setCurrentBattle, battleType);
    onGoBack();
  }, [navigationGoBack, onGoBack, setCurrentBattle, battleType]);

  const handleForceNextBattle = useCallback(() => {
    console.log("🔄 useBattleInteractions: Force next battle requested");
    
    if (isProcessing || processingStateRef.current) {
      console.log("🚫 handleForceNextBattle: Processing in progress, ignoring request");
      return;
    }
    
    const dismissEvent = new CustomEvent('milestone-dismissed', {
      detail: { forced: true, source: 'handleForceNextBattle' }
    });
    document.dispatchEvent(dismissEvent);
    
    console.log(`🔄 [LOADING CIRCLES] useBattleInteractions handleForceNextBattle: Setting processing states`);
    setIsProcessing(true);
    processingStateRef.current = true;
    setSelectedPokemon([]);
    
    if (processingTimeoutRef.current) {
      console.log(`🧹 [LOADING CIRCLES] useBattleInteractions handleForceNextBattle: Clearing processing timeout`);
      clearTimeout(processingTimeoutRef.current);
    }
    
    processingTimeoutRef.current = setTimeout(() => {
      try {
        onBattleComplete(battleType, currentBattle);
        
        toast.success("Starting new battle", { 
          description: "Moving on to the next battle" 
        });
      } catch (e) {
        console.error("❌ Error starting next battle:", e);
        toast.error("Error starting battle", {
          description: "There was a problem starting the next battle"
        });
      } finally {
        console.log(`🔄 [LOADING CIRCLES] useBattleInteractions handleForceNextBattle: Resetting processing states`);
        setIsProcessing(false);
        processingStateRef.current = false;
        processingTimeoutRef.current = null;
      }
    }, 200);
  }, [battleType, currentBattle, onBattleComplete, isProcessing]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing,
    handleForceNextBattle
  };
};
