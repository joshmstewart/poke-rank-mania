import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import BattleHeader from "./BattleHeader";
import BattleProgress from "./BattleProgress";
import BattleGrid from "./BattleGrid";
import BattleSubmitButton from "./BattleSubmitButton";
import { useMilestoneCalculations } from "@/hooks/battle/useMilestoneCalculations";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { toast } from "@/hooks/use-toast";

interface BattleInterfaceProps {
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void;
  onGoBack: () => void;
  milestones: number[];
  isProcessing?: boolean;
}

// Optimization: Memoize the most expensive components and stabilize props
const BattleInterface: React.FC<BattleInterfaceProps> = memo(({
  currentBattle,
  selectedPokemon,
  battlesCompleted,
  battleType,
  battleHistory,
  onPokemonSelect,
  onTripletSelectionComplete,
  onGoBack,
  milestones,
  isProcessing = false
}) => {
  // Component state - optimized for performance
  const [animationKey, setAnimationKey] = useState(0);
  const [internalProcessing, setInternalProcessing] = useState(false);
  const [displayedBattlesCompleted, setDisplayedBattlesCompleted] = useState(battlesCompleted);
  const [previousBattleIds, setPreviousBattleIds] = useState<number[]>([]);
  const lastSelectionRef = useRef<number | null>(null);
  const selectionTimestampRef = useRef(0);
  const lastProcessedBattleRef = useRef<number[]>([]);
  const internalProcessingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // LOADING CIRCLES DEBUG: Log all processing state changes with detailed tracking
  useEffect(() => {
    console.log(`🔄 [LOADING CIRCLES DEBUG] BattleInterface processing states changed:`, {
      isProcessing,
      internalProcessing,
      combined: isProcessing || internalProcessing,
      timestamp: new Date().toISOString(),
      source: 'BattleInterface-useEffect'
    });
    
    if (isProcessing || internalProcessing) {
      console.log(`🟡 [LOADING CIRCLES] BattleInterface CONTRIBUTING to loading circles - isProcessing: ${isProcessing}, internalProcessing: ${internalProcessing}`);
    } else {
      console.log(`🟢 [LOADING CIRCLES] BattleInterface NOT contributing to loading circles - both states false`);
    }
  }, [isProcessing, internalProcessing]);
  
  const { getNextMilestone, getMilestoneProgress } = useMilestoneCalculations(
    displayedBattlesCompleted, 
    milestones
  );
  
  // Validate current battle Pokemon to ensure image and name consistency
  const validatedBattle = currentBattle ? validateBattlePokemon(currentBattle) : [];

  // OPTIMIZATION: Only update animation key and logs when battle actually changes
  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) return;
    
    const currentIds = validatedBattle.map(p => p.id);
    
    // Check if this is actually a new battle compared to what we last processed
    const isSameAsPreviousProcessed = lastProcessedBattleRef.current.length === currentIds.length && 
      lastProcessedBattleRef.current.every(id => currentIds.includes(id)) &&
      currentIds.every(id => lastProcessedBattleRef.current.includes(id));
      
    if (isSameAsPreviousProcessed) {
      console.log("🔍 BattleInterface: Received same battle as already processed, skipping animation update");
      return;
    }
    
    // Update our reference to the last processed battle
    lastProcessedBattleRef.current = currentIds;
    
    // Increment animation key for fresh animations
    setAnimationKey(prev => prev + 1);
      
    // Debug: Log every time current battle changes
    const currentNames = validatedBattle.map(p => p.name);
    
    const isSameAsPrevious = previousBattleIds.length === currentIds.length && 
      previousBattleIds.every(id => currentIds.includes(id));
    
    const detailedLog = `Battle changed to [${currentIds.join(',')}] (${currentNames.join(', ')}) - Same as previous: ${isSameAsPrevious ? "YES ⚠️" : "NO ✅"}`;
    console.log(`🔄 BattleInterface: ${detailedLog}`);
    
    // Log battle type and expected Pokemon count
    console.log(`🔄 BattleInterface: Battle type: ${battleType}, Expected Pokémon count: ${battleType === "triplets" ? 3 : 2}, Actual count: ${validatedBattle.length}`);
    
    // When detecting repeated battle, log more details
    if (isSameAsPrevious) {
      console.warn(`⚠️ REPEAT BATTLE: Same Pokemon IDs detected in BattleInterface!`);
      console.warn(`⚠️ Previous: [${previousBattleIds.join(',')}], Current: [${currentIds.join(',')}]`);
    }
    
    // Create a custom event for monitoring battles
    const battleEvent = new CustomEvent('battle-displayed', { 
      detail: { 
        pokemonIds: currentIds,
        pokemonNames: validatedBattle.map(p => p.name),
        isSameAsPrevious: isSameAsPrevious,
        battleType
      } 
    });
    document.dispatchEvent(battleEvent);
    
    // Store current IDs as previous for next comparison
    setPreviousBattleIds(currentIds);
  }, [validatedBattle.map(p => p.id).join(','), battleType]); // Only depend on ID string, not entire objects
  
  // Update displayed battles completed for smoother UI
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
    console.log(`🔢 Battles completed updated to: ${battlesCompleted}`);
  }, [battlesCompleted]);
  
  // Clear timeout when component unmounts or when processing states change
  useEffect(() => {
    return () => {
      if (internalProcessingTimeoutRef.current) {
        console.log(`🧹 [LOADING CIRCLES] BattleInterface clearing internalProcessing timeout on cleanup`);
        clearTimeout(internalProcessingTimeoutRef.current);
        internalProcessingTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Handle pokemon selection with optimized debounce
  const handlePokemonCardSelect = useCallback((id: number) => {
    console.log(`🖱️ [LOADING CIRCLES DEBUG] handlePokemonCardSelect called:`, {
      id,
      isProcessing,
      internalProcessing,
      willIgnore: isProcessing || internalProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing && !internalProcessing) {
      const now = Date.now();
      
      // Prevent rapid double clicks (reduced to 200ms for better responsiveness)
      if (id === lastSelectionRef.current && now - selectionTimestampRef.current < 200) {
        console.log(`⏱️ Ignoring repeated selection of Pokemon ${id} (${now - selectionTimestampRef.current}ms after previous)`);
        return;
      }
      
      // Update refs
      lastSelectionRef.current = id;
      selectionTimestampRef.current = now;
      
      console.log(`🖱️ BattleInterface: Handling Pokemon selection: ${id}`);
      console.log(`🔄 [LOADING CIRCLES] BattleInterface: Setting internalProcessing = true for selection ${id}`);
      setInternalProcessing(true);
      onPokemonSelect(id);
      
      // Clear any existing timeout
      if (internalProcessingTimeoutRef.current) {
        console.log(`🧹 [LOADING CIRCLES] BattleInterface: Clearing existing internalProcessing timeout`);
        clearTimeout(internalProcessingTimeoutRef.current);
      }
      
      // Set new timeout with tracking
      internalProcessingTimeoutRef.current = setTimeout(() => {
        console.log(`🔄 [LOADING CIRCLES] BattleInterface: Setting internalProcessing = false (after 200ms timeout for selection ${id})`);
        setInternalProcessing(false);
        internalProcessingTimeoutRef.current = null;
      }, 200);
    } else {
      console.log(`⏳ [LOADING CIRCLES] BattleInterface: Ignoring click while processing (isProcessing=${isProcessing}, internalProcessing=${internalProcessing})`);
    }
  }, [isProcessing, internalProcessing, onPokemonSelect]);

  // Handle submission for triplets mode
  const handleSubmit = useCallback(() => {
    console.log(`🔄 [LOADING CIRCLES DEBUG] handleSubmit called:`, {
      isProcessing,
      internalProcessing,
      willIgnore: isProcessing || internalProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing && !internalProcessing) {
      console.log("BattleInterface: Submitting triplet selection");
      console.log(`🔄 [LOADING CIRCLES] BattleInterface: Setting internalProcessing = true for submit`);
      setInternalProcessing(true);
      onTripletSelectionComplete();
      
      // Clear any existing timeout
      if (internalProcessingTimeoutRef.current) {
        console.log(`🧹 [LOADING CIRCLES] BattleInterface: Clearing existing internalProcessing timeout for submit`);
        clearTimeout(internalProcessingTimeoutRef.current);
      }
      
      // Set new timeout with tracking
      internalProcessingTimeoutRef.current = setTimeout(() => {
        console.log(`🔄 [LOADING CIRCLES] BattleInterface: Setting internalProcessing = false (after submit timeout)`);
        setInternalProcessing(false);
        internalProcessingTimeoutRef.current = null;
      }, 200);
    }
  }, [isProcessing, internalProcessing, onTripletSelectionComplete]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    console.log(`🔄 [LOADING CIRCLES DEBUG] handleBackClick called:`, {
      isProcessing,
      internalProcessing,
      willIgnore: isProcessing || internalProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing && !internalProcessing) {
      console.log("BattleInterface: Handling back button click");
      onGoBack();
    }
  }, [isProcessing, internalProcessing, onGoBack]);

  // OPTIMIZED: Helper to validate battle configuration
  useEffect(() => {
    // Skip if no battle
    if (!validatedBattle || validatedBattle.length === 0) return;
    
    // Validate that battle type matches the number of Pokémon
    const expectedCount = battleType === "triplets" ? 3 : 2;
    if (validatedBattle.length !== expectedCount) {
      console.warn(`⚠️ BATTLE TYPE MISMATCH: Type is ${battleType} but have ${validatedBattle.length} Pokémon`);
      
      // Create a custom event to report this issue
      const mismatchEvent = new CustomEvent('battle-type-mismatch', {
        detail: {
          battleType,
          pokemonCount: validatedBattle.length,
          expectedCount,
          pokemonIds: validatedBattle.map(p => p.id)
        }
      });
      document.dispatchEvent(mismatchEvent);

      // Show toast notification when there's a mismatch
      toast({
        title: "Battle Type Mismatch",
        description: `Expected ${expectedCount} Pokémon for ${battleType} battles, but got ${validatedBattle.length}. This will be fixed automatically.`,
        duration: 3000, // Reduced from 5000ms to 3000ms
      });
    }
  }, [validatedBattle.length, battleType]); // Only depend on length and type, not entire battle array

  // Helper to ensure correct submit button display based on battle type
  const shouldShowSubmitButton = battleType === "triplets";
  
  // Only render if we have Pokemon to display
  if (!validatedBattle || validatedBattle.length === 0) {
    console.log(`🔄 [LOADING CIRCLES DEBUG] BattleInterface showing loading spinner (no battle data)`);
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }
  
  console.log(`🔄 [LOADING CIRCLES DEBUG] BattleInterface rendering with processing states:`, {
    isProcessing,
    internalProcessing,
    showingLoadingCircles: isProcessing || internalProcessing,
    timestamp: new Date().toISOString()
  });
  
  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <div className="mb-4">
        <BattleHeader
          battlesCompleted={displayedBattlesCompleted}
          onGoBack={handleBackClick}
          hasHistory={battleHistory.length > 0}
          isProcessing={isProcessing}
          internalProcessing={internalProcessing}
        />
        
        <BattleProgress
          battlesCompleted={displayedBattlesCompleted}
          getMilestoneProgress={getMilestoneProgress}
          getNextMilestone={getNextMilestone}
        />
      </div>
      
      <BattleGrid
        currentBattle={validatedBattle}
        selectedPokemon={selectedPokemon}
        onPokemonSelect={handlePokemonCardSelect}
        battleType={battleType}
        isProcessing={isProcessing}
        internalProcessing={internalProcessing}
        animationKey={animationKey}
      />
      
      {shouldShowSubmitButton && (
        <BattleSubmitButton
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          internalProcessing={internalProcessing}
          hasSelections={selectedPokemon.length > 0}
        />
      )}
    </div>
  );
});

// Add display name for easier debugging
BattleInterface.displayName = "BattleInterface";

export default BattleInterface;
