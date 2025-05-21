import React, { useState, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import BattleHeader from "./BattleHeader";
import BattleProgress from "./BattleProgress";
import BattleGrid from "./BattleGrid";
import BattleSubmitButton from "./BattleSubmitButton";
import { useMilestoneCalculations } from "@/hooks/battle/useMilestoneCalculations";

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

const BattleInterface: React.FC<BattleInterfaceProps> = ({
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
  // Component state
  const [animationKey, setAnimationKey] = useState(0);
  const [internalProcessing, setInternalProcessing] = useState(false);
  const [displayedBattlesCompleted, setDisplayedBattlesCompleted] = useState(battlesCompleted);
  const [previousBattleIds, setPreviousBattleIds] = useState<number[]>([]);
  const [battleChangeLog, setBattleChangeLog] = useState<string[]>([]);
  
  const { getNextMilestone, getMilestoneProgress } = useMilestoneCalculations(
    displayedBattlesCompleted, 
    milestones
  );
  
  // Update animation key when current battle changes
  useEffect(() => {
    if (currentBattle && currentBattle.length > 0) {
      setAnimationKey(prev => prev + 1);
      
      // Debug: Log every time current battle changes
      const currentIds = currentBattle.map(p => p.id);
      const currentNames = currentBattle.map(p => p.name);
      
      const isSameAsPrevious = previousBattleIds.length === currentIds.length && 
        previousBattleIds.every(id => currentIds.includes(id));
      
      const detailedLog = `Battle changed to [${currentIds.join(',')}] (${currentNames.join(', ')}) - Same as previous: ${isSameAsPrevious ? "YES ⚠️" : "NO ✅"}`;
      console.log(`🔄 BattleInterface: ${detailedLog}`);
      
      // Keep a rolling log of battle changes for deeper analysis
      setBattleChangeLog(prev => {
        const updated = [...prev, detailedLog];
        // Keep only most recent 10 changes
        return updated.slice(-10);
      });
      
      // When detecting repeated battle, log more details
      if (isSameAsPrevious) {
        console.warn(`⚠️ REPEAT BATTLE: Same Pokemon IDs detected in BattleInterface!`);
        console.warn(`⚠️ Previous: [${previousBattleIds.join(',')}], Current: [${currentIds.join(',')}]`);
        
        // Compare complete Pokémon objects for deeper analysis
        const pokemonDetails = currentBattle.map(p => ({
          id: p.id,
          name: p.name,
          hasOwnProperties: Object.getOwnPropertyNames(p).join(',')
        }));
        console.warn(`🔍 DEEP INSPECTION: Current battle Pokémon details:`, pokemonDetails);
      }
      
      // Create a custom event for monitoring battles
      const battleEvent = new CustomEvent('battle-created', { 
        detail: { 
          pokemonIds: currentIds,
          pokemonNames: currentBattle.map(p => p.name),
          isSameAsPrevious: isSameAsPrevious
        } 
      });
      document.dispatchEvent(battleEvent);
      
      // Store current IDs as previous for next comparison
      setPreviousBattleIds(currentIds);
    }
  }, [currentBattle]);
  
  // Log battle history changes
  useEffect(() => {
    console.log(`📚 Battle history updated: ${battleHistory.length} entries`);
    if (battleHistory.length > 0) {
      const lastBattle = battleHistory[battleHistory.length - 1];
      console.log(`📚 Last battle in history: Pokemon [${lastBattle.battle.map(p => p.id).join(',')}], Selected [${lastBattle.selected.join(',')}]`);
    }
  }, [battleHistory.length]);
  
  // Update displayed battles completed for smoother UI
  useEffect(() => {
    setDisplayedBattlesCompleted(battlesCompleted);
    console.log(`🔢 Battles completed updated to: ${battlesCompleted}`);
  }, [battlesCompleted]);
  
  // Handle pokemon selection with debounce to prevent multiple clicks
  const handlePokemonCardSelect = (id: number) => {
    if (!isProcessing && !internalProcessing) {
      console.log(`🖱️ BattleInterface: Handling Pokemon selection: ${id}`);
      setInternalProcessing(true);
      onPokemonSelect(id);
      
      // Reset internal processing state after a shorter delay (100ms)
      setTimeout(() => setInternalProcessing(false), 100);
    } else {
      console.log(`⏳ BattleInterface: Ignoring click while processing (isProcessing=${isProcessing}, internalProcessing=${internalProcessing})`);
    }
  };

  // Handle submission for triplets mode
  const handleSubmit = () => {
    if (!isProcessing && !internalProcessing) {
      console.log("BattleInterface: Submitting triplet selection");
      setInternalProcessing(true);
      onTripletSelectionComplete();
      
      // Reset internal processing state after a shorter delay (100ms)
      setTimeout(() => setInternalProcessing(false), 100);
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    if (!isProcessing && !internalProcessing) {
      onGoBack();
    }
  };
  
  // Debug component: Battle change history
  const BattleChangeDebug = () => (
    <div className="text-xs text-gray-400 mt-2 hidden">
      <div>Recent Battle Changes:</div>
      <ul>
        {battleChangeLog.map((log, idx) => (
          <li key={idx}>{log}</li>
        ))}
      </ul>
    </div>
  );
  
  // Only render if we have Pokemon to display
  if (!currentBattle || currentBattle.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }
  
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
        
        {/* Hidden debug component */}
        <BattleChangeDebug />
      </div>
      
      <BattleGrid
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        onPokemonSelect={handlePokemonCardSelect}
        battleType={battleType}
        isProcessing={isProcessing}
        internalProcessing={internalProcessing}
        animationKey={animationKey}
      />
      
      {battleType === "triplets" && (
        <BattleSubmitButton
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          internalProcessing={internalProcessing}
          hasSelections={selectedPokemon.length > 0}
        />
      )}
    </div>
  );
};

export default BattleInterface;
