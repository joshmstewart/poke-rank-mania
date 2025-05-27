
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
import { Skeleton } from "@/components/ui/skeleton";

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
  
  console.log(`🔄 [GRAY SCREEN FIX] BattleInterface render state:`, {
    isProcessing,
    currentBattleLength: currentBattle?.length || 0,
    currentBattleIds: currentBattle?.map(p => p.id) || [],
    hasValidBattle: currentBattle && currentBattle.length > 0,
    shouldShowGrayScreen: !currentBattle || currentBattle.length === 0,
    timestamp: new Date().toISOString(),
    source: 'BattleInterface-main'
  });
  
  const { getNextMilestone, getMilestoneProgress } = useMilestoneCalculations(
    displayedBattlesCompleted, 
    milestones
  );
  
  // Validate current battle Pokemon
  const validatedBattle = currentBattle ? validateBattlePokemon(currentBattle) : [];

  console.log(`🔄 [GRAY SCREEN FIX] Battle validation:`, {
    originalLength: currentBattle?.length || 0,
    validatedLength: validatedBattle?.length || 0,
    willShowGrayScreen: !validatedBattle || validatedBattle.length === 0,
    timestamp: new Date().toISOString()
  });

  // Log when battle data changes
  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) {
      console.log(`🔄 [GRAY SCREEN FIX] BattleInterface: No validated battle data - this will cause gray screen`);
      console.log(`🔄 [GRAY SCREEN FIX] Raw currentBattle:`, currentBattle);
      console.log(`🔄 [GRAY SCREEN FIX] Validated result:`, validatedBattle);
      return;
    }
    
    const currentIds = validatedBattle.map(p => p.id);
    
    // Check if this is actually a new battle
    const isSameAsPreviousProcessed = lastProcessedBattleRef.current.length === currentIds.length && 
      lastProcessedBattleRef.current.every(id => currentIds.includes(id)) &&
      currentIds.every(id => lastProcessedBattleRef.current.includes(id));
      
    if (isSameAsPreviousProcessed) {
      console.log("🔍 [GRAY SCREEN FIX] BattleInterface: Same battle as processed, skipping animation update");
      return;
    }
    
    // Update references
    lastProcessedBattleRef.current = currentIds;
    setAnimationKey(prev => prev + 1);
      
    const currentNames = validatedBattle.map(p => p.name);
    const isSameAsPrevious = previousBattleIds.length === currentIds.length && 
      previousBattleIds.every(id => currentIds.includes(id));
    
    console.log(`🔄 [GRAY SCREEN FIX] BattleInterface battle change: [${currentIds.join(',')}] (${currentNames.join(', ')}) - Same as previous: ${isSameAsPrevious ? "YES ⚠️" : "NO ✅"}`);
    
    if (isSameAsPrevious) {
      console.warn(`⚠️ [GRAY SCREEN FIX] REPEAT BATTLE detected in BattleInterface!`);
    }
    
    setPreviousBattleIds(currentIds);
  }, [validatedBattle.map(p => p.id).join(','), battleType]);
  
  // Update battles completed
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
    console.log(`🔢 [GRAY SCREEN FIX] Battles completed updated to: ${battlesCompleted}`);
  }, [battlesCompleted]);
  
  // Click handlers
  const handlePokemonCardSelect = useCallback((id: number) => {
    console.log(`🖱️ [GRAY SCREEN FIX] handlePokemonCardSelect:`, {
      id,
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      const now = Date.now();
      
      if (id === lastSelectionRef.current && now - selectionTimestampRef.current < 300) {
        console.log(`⏱️ [GRAY SCREEN FIX] Ignoring repeated selection of Pokemon ${id}`);
        return;
      }
      
      lastSelectionRef.current = id;
      selectionTimestampRef.current = now;
      
      console.log(`🖱️ [GRAY SCREEN FIX] Processing Pokemon selection: ${id}`);
      onPokemonSelect(id);
    } else {
      console.log(`⏳ [GRAY SCREEN FIX] Ignoring click while processing`);
    }
  }, [isProcessing, onPokemonSelect]);

  const handleSubmit = useCallback(() => {
    console.log(`🔄 [GRAY SCREEN FIX] handleSubmit:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[GRAY SCREEN FIX] Submitting triplet selection");
      onTripletSelectionComplete();
    }
  }, [isProcessing, onTripletSelectionComplete]);

  const handleBackClick = useCallback(() => {
    console.log(`🔄 [GRAY SCREEN FIX] handleBackClick:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[GRAY SCREEN FIX] Handling back button click");
      onGoBack();
    }
  }, [isProcessing, onGoBack]);

  // Battle type validation
  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) return;
    
    const expectedCount = battleType === "triplets" ? 3 : 2;
    if (validatedBattle.length !== expectedCount) {
      console.warn(`⚠️ [GRAY SCREEN FIX] BATTLE TYPE MISMATCH: Type is ${battleType} but have ${validatedBattle.length} Pokémon`);
      
      toast({
        title: "Battle Type Mismatch",
        description: `Expected ${expectedCount} Pokémon for ${battleType} battles, but got ${validatedBattle.length}. This will be fixed automatically.`,
        duration: 3000,
      });
    }
  }, [validatedBattle.length, battleType]);

  const shouldShowSubmitButton = battleType === "triplets";
  
  // CRITICAL FIX: Instead of showing gray loading spinner, show skeleton placeholders
  if (!validatedBattle || validatedBattle.length === 0) {
    console.log(`🔄 [GRAY SCREEN FIX] BattleInterface showing skeleton instead of gray screen`);
    console.log(`🔄 [GRAY SCREEN FIX] Skeleton details:`, {
      currentBattle: currentBattle?.length || 0,
      validatedBattle: validatedBattle?.length || 0,
      isProcessing,
      timestamp: new Date().toISOString()
    });
    
    return (
      <div className="bg-white rounded-lg shadow p-6 w-full">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        
        {shouldShowSubmitButton && (
          <div className="flex justify-center">
            <Skeleton className="h-12 w-32" />
          </div>
        )}
      </div>
    );
  }
  
  console.log(`🔄 [GRAY SCREEN FIX] BattleInterface rendering normally:`, {
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
