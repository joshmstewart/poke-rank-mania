
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
  
  console.log(`🔄 [BATTLE_INTERFACE_DEBUG] BattleInterface render state:`, {
    isProcessing,
    currentBattleLength: currentBattle?.length || 0,
    currentBattleIds: currentBattle?.map(p => p.id) || [],
    hasValidBattle: currentBattle && currentBattle.length > 0,
    timestamp: new Date().toISOString()
  });
  
  const { getNextMilestone, getMilestoneProgress } = useMilestoneCalculations(
    displayedBattlesCompleted, 
    milestones
  );
  
  // CRITICAL FIX: Handle empty battle during transitions
  const validatedBattle = currentBattle && currentBattle.length > 0 ? validateBattlePokemon(currentBattle) : [];

  console.log(`🔄 [BATTLE_INTERFACE_DEBUG] Battle validation:`, {
    originalLength: currentBattle?.length || 0,
    validatedLength: validatedBattle?.length || 0,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) {
      console.log(`⚠️ [BATTLE_INTERFACE_DEBUG] No validated battle data available`);
      return;
    }
    
    const currentIds = validatedBattle.map(p => p.id);
    
    const isSameAsPreviousProcessed = lastProcessedBattleRef.current.length === currentIds.length && 
      lastProcessedBattleRef.current.every(id => currentIds.includes(id)) &&
      currentIds.every(id => lastProcessedBattleRef.current.includes(id));
      
    if (isSameAsPreviousProcessed) {
      console.log("🔍 [BATTLE_INTERFACE_DEBUG] Same battle as processed, skipping animation update");
      return;
    }
    
    lastProcessedBattleRef.current = currentIds;
    setAnimationKey(prev => prev + 1);
      
    const currentNames = validatedBattle.map(p => p.name);
    const isSameAsPrevious = previousBattleIds.length === currentIds.length && 
      previousBattleIds.every(id => currentIds.includes(id));
    
    console.log(`🔄 [BATTLE_INTERFACE_DEBUG] Battle change: [${currentIds.join(',')}] (${currentNames.join(', ')}) - Same as previous: ${isSameAsPrevious ? "YES ⚠️" : "NO ✅"}`);
    
    setPreviousBattleIds(currentIds);
  }, [validatedBattle.map(p => p.id).join(','), battleType]);
  
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
    console.log(`🔢 [BATTLE_INTERFACE_DEBUG] Battles completed updated to: ${battlesCompleted}`);
  }, [battlesCompleted]);
  
  const handlePokemonCardSelect = useCallback((id: number) => {
    console.log(`🖱️ [BATTLE_INTERFACE_DEBUG] handlePokemonCardSelect:`, {
      id,
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      const now = Date.now();
      
      if (id === lastSelectionRef.current && now - selectionTimestampRef.current < 300) {
        console.log(`⏱️ [BATTLE_INTERFACE_DEBUG] Ignoring repeated selection of Pokemon ${id}`);
        return;
      }
      
      lastSelectionRef.current = id;
      selectionTimestampRef.current = now;
      
      console.log(`🖱️ [BATTLE_INTERFACE_DEBUG] Processing Pokemon selection: ${id}`);
      onPokemonSelect(id);
    } else {
      console.log(`⏳ [BATTLE_INTERFACE_DEBUG] Ignoring click while processing`);
    }
  }, [isProcessing, onPokemonSelect]);

  const handleSubmit = useCallback(() => {
    console.log(`🔄 [BATTLE_INTERFACE_DEBUG] handleSubmit:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[BATTLE_INTERFACE_DEBUG] Submitting triplet selection");
      onTripletSelectionComplete();
    }
  }, [isProcessing, onTripletSelectionComplete]);

  const handleBackClick = useCallback(() => {
    console.log(`🔄 [BATTLE_INTERFACE_DEBUG] handleBackClick:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[BATTLE_INTERFACE_DEBUG] Handling back button click");
      onGoBack();
    }
  }, [isProcessing, onGoBack]);

  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) return;
    
    const expectedCount = battleType === "triplets" ? 3 : 2;
    if (validatedBattle.length !== expectedCount) {
      console.warn(`⚠️ [BATTLE_INTERFACE_DEBUG] BATTLE TYPE MISMATCH: Type is ${battleType} but have ${validatedBattle.length} Pokémon`);
      
      toast({
        title: "Battle Type Mismatch",
        description: `Expected ${expectedCount} Pokémon for ${battleType} battles, but got ${validatedBattle.length}. This will be fixed automatically.`,
        duration: 3000,
      });
    }
  }, [validatedBattle.length, battleType]);

  const shouldShowSubmitButton = battleType === "triplets";
  
  // CRITICAL FIX: Show interface even with empty battle during transitions, but with placeholder
  if (!validatedBattle || validatedBattle.length === 0) {
    console.log(`⚠️ [BATTLE_INTERFACE_DEBUG] No battle data - showing transition placeholder`);
    return (
      <div className="bg-white rounded-lg shadow p-6 w-full">
        <div className="mb-4">
          <BattleHeader
            battlesCompleted={displayedBattlesCompleted}
            onGoBack={handleBackClick}
            hasHistory={battleHistory.length > 0}
            isProcessing={true}
            internalProcessing={false}
          />
          
          <BattleProgress
            battlesCompleted={displayedBattlesCompleted}
            getMilestoneProgress={getMilestoneProgress}
            getNextMilestone={getNextMilestone}
          />
        </div>
        
        {/* Transition placeholder */}
        <div className="grid gap-4 mt-8 grid-cols-2">
          {[1, 2].map((placeholder) => (
            <div key={`transition-placeholder-${placeholder}`} className="w-full h-[200px] bg-gray-100 animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }
  
  console.log(`✅ [BATTLE_INTERFACE_DEBUG] Rendering interface with ${validatedBattle.length} Pokemon`);
  
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
