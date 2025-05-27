
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
  const [animationKey, setAnimationKey] = useState(0);
  const [displayedBattlesCompleted, setDisplayedBattlesCompleted] = useState(battlesCompleted);
  const [previousBattleIds, setPreviousBattleIds] = useState<number[]>([]);
  const lastSelectionRef = useRef<number | null>(null);
  const selectionTimestampRef = useRef(0);
  const lastProcessedBattleRef = useRef<number[]>([]);
  
  console.log(`🔄 [GRAY SCREEN DEBUG] BattleInterface render state:`, {
    isProcessing,
    currentBattleLength: currentBattle?.length || 0,
    currentBattleIds: currentBattle?.map(p => p.id) || [],
    hasValidBattle: currentBattle && currentBattle.length > 0,
    timestamp: new Date().toISOString(),
    source: 'BattleInterface-main'
  });
  
  const { getNextMilestone, getMilestoneProgress } = useMilestoneCalculations(
    displayedBattlesCompleted, 
    milestones
  );
  
  // Validate current battle Pokemon
  const validatedBattle = currentBattle ? validateBattlePokemon(currentBattle) : [];

  // Log when battle data changes
  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) {
      console.log(`🔄 [GRAY SCREEN DEBUG] BattleInterface: No validated battle data - this might cause gray screen`);
      return;
    }
    
    const currentIds = validatedBattle.map(p => p.id);
    
    // Check if this is actually a new battle
    const isSameAsPreviousProcessed = lastProcessedBattleRef.current.length === currentIds.length && 
      lastProcessedBattleRef.current.every(id => currentIds.includes(id)) &&
      currentIds.every(id => lastProcessedBattleRef.current.includes(id));
      
    if (isSameAsPreviousProcessed) {
      console.log("🔍 [GRAY SCREEN DEBUG] BattleInterface: Same battle as processed, skipping animation update");
      return;
    }
    
    // Update references
    lastProcessedBattleRef.current = currentIds;
    setAnimationKey(prev => prev + 1);
      
    const currentNames = validatedBattle.map(p => p.name);
    const isSameAsPrevious = previousBattleIds.length === currentIds.length && 
      previousBattleIds.every(id => currentIds.includes(id));
    
    console.log(`🔄 [GRAY SCREEN DEBUG] BattleInterface battle change: [${currentIds.join(',')}] (${currentNames.join(', ')}) - Same as previous: ${isSameAsPrevious ? "YES ⚠️" : "NO ✅"}`);
    
    if (isSameAsPrevious) {
      console.warn(`⚠️ [GRAY SCREEN DEBUG] REPEAT BATTLE detected in BattleInterface!`);
    }
    
    setPreviousBattleIds(currentIds);
  }, [validatedBattle.map(p => p.id).join(','), battleType]);
  
  // Update battles completed
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
    console.log(`🔢 [GRAY SCREEN DEBUG] Battles completed updated to: ${battlesCompleted}`);
  }, [battlesCompleted]);
  
  // Click handlers
  const handlePokemonCardSelect = useCallback((id: number) => {
    console.log(`🖱️ [GRAY SCREEN DEBUG] handlePokemonCardSelect:`, {
      id,
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      const now = Date.now();
      
      if (id === lastSelectionRef.current && now - selectionTimestampRef.current < 300) {
        console.log(`⏱️ [GRAY SCREEN DEBUG] Ignoring repeated selection of Pokemon ${id}`);
        return;
      }
      
      lastSelectionRef.current = id;
      selectionTimestampRef.current = now;
      
      console.log(`🖱️ [GRAY SCREEN DEBUG] Processing Pokemon selection: ${id}`);
      onPokemonSelect(id);
    } else {
      console.log(`⏳ [GRAY SCREEN DEBUG] Ignoring click while processing`);
    }
  }, [isProcessing, onPokemonSelect]);

  const handleSubmit = useCallback(() => {
    console.log(`🔄 [GRAY SCREEN DEBUG] handleSubmit:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[GRAY SCREEN DEBUG] Submitting triplet selection");
      onTripletSelectionComplete();
    }
  }, [isProcessing, onTripletSelectionComplete]);

  const handleBackClick = useCallback(() => {
    console.log(`🔄 [GRAY SCREEN DEBUG] handleBackClick:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[GRAY SCREEN DEBUG] Handling back button click");
      onGoBack();
    }
  }, [isProcessing, onGoBack]);

  // Battle type validation
  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) return;
    
    const expectedCount = battleType === "triplets" ? 3 : 2;
    if (validatedBattle.length !== expectedCount) {
      console.warn(`⚠️ [GRAY SCREEN DEBUG] BATTLE TYPE MISMATCH: Type is ${battleType} but have ${validatedBattle.length} Pokémon`);
      
      toast({
        title: "Battle Type Mismatch",
        description: `Expected ${expectedCount} Pokémon for ${battleType} battles, but got ${validatedBattle.length}. This will be fixed automatically.`,
        duration: 3000,
      });
    }
  }, [validatedBattle.length, battleType]);

  const shouldShowSubmitButton = battleType === "triplets";
  
  // CRITICAL: Check for the gray screen condition
  if (!validatedBattle || validatedBattle.length === 0) {
    console.log(`🔄 [GRAY SCREEN DEBUG] BattleInterface showing loading spinner - THIS MIGHT BE THE GRAY SCREEN SOURCE`);
    console.log(`🔄 [GRAY SCREEN DEBUG] Spinner details:`, {
      currentBattle: currentBattle?.length || 0,
      validatedBattle: validatedBattle?.length || 0,
      isProcessing,
      timestamp: new Date().toISOString()
    });
    
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }
  
  console.log(`🔄 [GRAY SCREEN DEBUG] BattleInterface rendering normally:`, {
    isProcessing,
    validatedBattleLength: validatedBattle.length,
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
          internalProcessing={false}
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
        internalProcessing={false}
        animationKey={animationKey}
      />
      
      {shouldShowSubmitButton && (
        <BattleSubmitButton
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          internalProcessing={false}
          hasSelections={selectedPokemon.length > 0}
        />
      )}
    </div>
  );
});

BattleInterface.displayName = "BattleInterface";

export default BattleInterface;
