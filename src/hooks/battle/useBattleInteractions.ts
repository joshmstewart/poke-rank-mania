
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

  // Clear any timeouts on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Reset selectedPokemon when battle type changes or current battle changes
  useEffect(() => {
    console.log("🔄 Resetting selected pokemon due to battle change or type change");
    setSelectedPokemon([]);
    setLastSelectedId(null);
    setIsProcessing(false);
    processingStateRef.current = false;
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, [battleType, setSelectedPokemon, currentBattle]);

  // Listen for milestone dismiss events
  useEffect(() => {
    const handleMilestoneDismissed = () => {
      console.log("📣 useBattleInteractions: Received milestone-dismissed event");
      
      // Reset processing state when milestone is dismissed
      setIsProcessing(false);
      processingStateRef.current = false;
      
      if (processingTimeoutRef.current) {
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
      // Guard against empty battles
      if (!currentBattle || currentBattle.length === 0) {
        console.warn("🚫 handlePokemonSelect called with empty battle");
        return;
      }
      
      // Check processing status - only ignore if actually processing
      if (isProcessing || processingStateRef.current) {
        console.log("🛑 handlePokemonSelect: Processing in progress, ignoring click");
        toast.info("Please wait...", {
          description: "Processing current selection"
        });
        return;
      }
      
      // Debounce rapid clicks
      if (clickDebounceRef.current) {
        console.log(`🛑 Ignoring rapid click on Pokemon ID: ${id} (debounce active)`);
        return;
      }
      
      // Set debounce flag
      clickDebounceRef.current = true;
      setTimeout(() => {
        clickDebounceRef.current = false;
      }, 800);
      
      // Prevent duplicate processing of the same Pokemon
      if (lastSelectedId === id && battleType === "pairs") {
        console.log(`🔄 Ignoring duplicate selection of Pokemon ID: ${id}`);
        return;
      }
      
      console.log(`👆 handlePokemonSelect: Selected Pokemon ID: ${id} for ${battleType} battle`);
      
      // Set both state and ref to prevent race conditions
      setIsProcessing(true);
      processingStateRef.current = true;
      
      // For pair battles, always set to just the newly selected Pokemon ID
      let updatedSelected: number[] = [];
      
      if (battleType === "pairs") {
        updatedSelected = [id];
        console.log(`🛠️ [PAIR BATTLE] Setting selection to: [${id}]`);
      } else {
        // For triplets, accumulate selections (up to 2)
        if (selectedPokemon.length >= 2) {
          updatedSelected = [id];
        } else {
          updatedSelected = [...selectedPokemon, id];
        }
      }

      setLastSelectedId(id);
      setSelectedPokemon(updatedSelected);
      
      console.log(`🎮 handlePokemonSelect: Updated selection to [${updatedSelected.join(', ')}] for ${battleType} battle`);

      // For pairs mode, immediately process once a Pokémon is selected
      if (battleType === "pairs") {
        const currentBattleCopy = [...currentBattle];
        
        // Save to history before processing
        const updatedHistory = [
          ...battleHistory,
          { battle: currentBattleCopy, selected: updatedSelected }
        ];
        setBattleHistory(updatedHistory);
        console.log("🔄 Updating battle history. New length:", updatedHistory.length);
        
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        
        // Process the battle results with visual feedback
        processingTimeoutRef.current = setTimeout(() => {
          try {
            console.log(`[DEBUG useBattleInteractions] Processing battle result for:`, updatedSelected);
            
            // Show selection feedback
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
            setIsProcessing(false);
            processingStateRef.current = false;
            toast.error("Battle processing error", {
              description: "There was a problem processing your selection"
            });
          } finally {
            processingTimeoutRef.current = null;
          }
        }, 600); // Reduced timeout for better responsiveness
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
    
    // Clear any processing state
    setIsProcessing(false);
    processingStateRef.current = false;
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    navigationGoBack(setCurrentBattle, battleType);
    onGoBack();
  }, [navigationGoBack, onGoBack, setCurrentBattle, battleType]);

  // Function to handle force next battle for milestone page
  const handleForceNextBattle = useCallback(() => {
    console.log("🔄 useBattleInteractions: Force next battle requested");
    
    if (isProcessing || processingStateRef.current) {
      console.log("🚫 handleForceNextBattle: Processing in progress, ignoring request");
      return;
    }
    
    // Force dismiss milestone first
    const dismissEvent = new CustomEvent('milestone-dismissed', {
      detail: { forced: true, source: 'handleForceNextBattle' }
    });
    document.dispatchEvent(dismissEvent);
    
    // Set processing state
    setIsProcessing(true);
    processingStateRef.current = true;
    setSelectedPokemon([]);
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Trigger battle completion after brief delay
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
        setIsProcessing(false);
        processingStateRef.current = false;
        processingTimeoutRef.current = null;
      }
    }, 200); // Reduced delay for better responsiveness
  }, [battleType, currentBattle, onBattleComplete, isProcessing]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing,
    handleForceNextBattle
  };
};
