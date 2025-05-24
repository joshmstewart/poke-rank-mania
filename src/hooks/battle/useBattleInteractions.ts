
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
    
    // Also clear any processing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
  }, [battleType, setSelectedPokemon, currentBattle]);

  // Listen for milestone dismiss events - improved coordination between components
  useEffect(() => {
    const handleDismissMilestone = (event: CustomEvent) => {
      console.log("📣 useBattleInteractions: Received dismiss-milestone event");
      
      // Reset processing state when milestone is dismissed
      setIsProcessing(false);
      processingStateRef.current = false;
      
      // Clear any existing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
    
    // Add event listener with type assertion
    document.addEventListener('dismiss-milestone', handleDismissMilestone as EventListener);
    
    return () => {
      document.removeEventListener('dismiss-milestone', handleDismissMilestone as EventListener);
    };
  }, []);

  const handlePokemonSelect = useCallback(
    (id: number) => {
      // Guard against empty battles
      if (!currentBattle || currentBattle.length === 0) {
        console.warn("🚫 handlePokemonSelect called with empty battle");
        return;
      }
      
      // Check both refs and state for processing status
      const isCurrentlyProcessing = isProcessing || processingStateRef.current;
      
      if (isCurrentlyProcessing) {
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
      }, 800); // 800ms debounce (increased from 500ms)
      
      // Prevent duplicate processing of the same Pokemon
      if (lastSelectedId === id && battleType === "pairs") {
        console.log(`🔄 Ignoring duplicate selection of Pokemon ID: ${id}`);
        return;
      }
      
      console.log(`👆 handlePokemonSelect: Selected Pokemon ID: ${id} for ${battleType} battle`);
      
      // CRITICAL FIX: Set both state and ref to prevent race conditions
      setIsProcessing(true);
      processingStateRef.current = true;
      
      // CRITICAL FIX: For pair battles, we ALWAYS set to just the newly selected Pokemon ID
      let updatedSelected: number[] = [];
      
      if (battleType === "pairs") {
        // For pairs, we always set to ONLY the newly selected Pokemon ID
        updatedSelected = [id]; // <-- Critical fix: Always a new single-element array
        console.log(`🛠️ [PAIR BATTLE FIX] Setting selection to a SINGLE ID: [${id}]`);
      } else {
        // For triplets, we accumulate selections (up to 2)
        // If we already have 2 selections, replace the array with just this new ID
        if (selectedPokemon.length >= 2) {
          updatedSelected = [id];
        } else {
          updatedSelected = [...selectedPokemon, id];
        }
      }

      // Track this selection to prevent duplicates
      setLastSelectedId(id);

      // Update the selected Pokémon state
      console.log(`🔍 [BEFORE STATE UPDATE] Current selectedPokemon: [${selectedPokemon.join(', ')}]`);
      console.log(`🔍 [STATE UPDATE] Setting selectedPokemon to: [${updatedSelected.join(', ')}]`);
      setSelectedPokemon(updatedSelected);
      
      // Log after state update (though this will show the previous state due to React's batching)
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
        console.log("🔄 Updating battle history explicitly. New length:", updatedHistory.length);
        
        // Clear any existing timeout
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        
        // Process the battle results with a minimum visible delay
        processingTimeoutRef.current = setTimeout(() => {
          try {
            // CRITICAL FIX: Always use the updatedSelected array directly, not the state variable
            // which might not have updated yet due to React's batching of state updates
            console.log(`[DEBUG useBattleInteractions] Passing to processBattleResult - selectedPokemonIds:`, updatedSelected);
            
            // ENHANCED: Add visual feedback that processing is happening
            const selectedPokemon = currentBattleCopy.find(p => p.id === id);
            if (selectedPokemon) {
              toast.success(`Selected ${selectedPokemon.name}`, {
                duration: 700  // Short duration
              });
            }
            
            processBattleResult(updatedSelected, currentBattleCopy, battleType);
            console.log("✅ useBattleInteractions: Battle processed successfully");
          } catch (e) {
            console.error("❌ Error processing battle:", e);
            // Ensure processing state is reset even when errors occur
            setIsProcessing(false);
            processingStateRef.current = false;
            toast.error("Battle processing error", {
              description: "There was a problem processing your selection"
            });
          } finally {
            // Clear the timeout ref since it's completed
            processingTimeoutRef.current = null;
          }
        }, 800); // Show processing state for at least 800ms for better UX
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
      isProcessing
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

  // Add function to manually force new battle for milestone page
  const handleForceNextBattle = useCallback(() => {
    console.log("🔄 useBattleInteractions: Force next battle requested from milestone page");
    
    // Prevent multiple concurrent requests
    if (isProcessing || processingStateRef.current) {
      console.log("🚫 handleForceNextBattle: Processing in progress, ignoring request");
      toast.info("Please wait...", {
        description: "Processing current request"
      });
      return;
    }
    
    // FIXED: First explicitly dismiss milestone state
    // Create custom event to ensure other components know milestone is dismissed
    const dismissMilestoneEvent = new CustomEvent('dismiss-milestone', {
      detail: { forced: true, source: 'handleForceNextBattle' }
    });
    document.dispatchEvent(dismissMilestoneEvent);
    
    // Force reset any processing state
    setIsProcessing(true);
    processingStateRef.current = true;
    setSelectedPokemon([]);
    
    // Clear any pending timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Trigger battle completion callback with empty selection after a short delay
    processingTimeoutRef.current = setTimeout(() => {
      try {
        // This will effectively move to the next battle
        onBattleComplete(battleType, currentBattle);
        
        // Give explicit feedback to the user
        toast.success("Starting new battle", { 
          description: "Moving on to the next battle" 
        });
      } catch (e) {
        console.error("❌ Error starting next battle:", e);
        toast.error("Error starting battle", {
          description: "There was a problem starting the next battle"
        });
      } finally {
        // Always reset processing state and clear timeout
        setIsProcessing(false);
        processingStateRef.current = false;
        processingTimeoutRef.current = null;
      }
    }, 300);
  }, [battleType, currentBattle, onBattleComplete, isProcessing]);

  return {
    handlePokemonSelect,
    handleGoBack,
    isProcessing,
    handleForceNextBattle  // Function to handle milestone page "Next Battle" button
  };
};
