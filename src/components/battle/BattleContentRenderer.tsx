
import React, { useState } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "@/hooks/battle/types";
import { RankingMode } from "@/components/ranking/RankingModeSelector";
import { useUnifiedTrueSkillRankings } from "@/hooks/ranking/useUnifiedTrueSkillRankings";
import { usePendingRefinementsManager } from "@/hooks/battle/usePendingRefinementsManager";
import BattleControls from "./BattleControls";
import BattleView from "./BattleView";
import MilestoneView from "./MilestoneView";
import ManualRankingMode from "@/components/ranking/ManualRankingMode";
import ImpliedBattleValidator from "./ImpliedBattleValidator";

interface BattleContentRendererProps {
  showingMilestone: boolean;
  currentBattle: Pokemon[];
  selectedPokemon: number[];
  battlesCompleted: number;
  battleType: BattleType;
  battleHistory: any[];
  selectedGeneration: number;
  finalRankings: RankedPokemon[];
  activeTier: TopNOption;
  milestones: number[];
  rankingGenerated: boolean;
  isAnyProcessing: boolean;
  setSelectedGeneration: (gen: number) => void;
  setBattleType: (type: BattleType) => void;
  setShowingMilestone: (showing: boolean) => void;
  setActiveTier: (tier: TopNOption) => void;
  handlePokemonSelect: (pokemonId: number) => void;
  handleTripletSelectionComplete: () => void;
  goBack: () => void;
  handleContinueBattles: () => void;
  performFullBattleReset: () => void;
  handleSaveRankings: () => void;
  suggestRanking: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  removeSuggestion: (pokemonId: number) => void;
  resetMilestoneInProgress: () => void;
  handleManualReorder: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onRankingsUpdate: (updatedRankings: RankedPokemon[]) => void;
  setBattlesCompleted?: React.Dispatch<React.SetStateAction<number>>;
  setBattleResults?: React.Dispatch<React.SetStateAction<SingleBattle[]>>;
}

const BattleContentRenderer: React.FC<BattleContentRendererProps> = ({
  showingMilestone,
  currentBattle,
  selectedPokemon,
  battlesCompleted,
  battleType,
  battleHistory,
  selectedGeneration,
  finalRankings,
  activeTier,
  milestones,
  rankingGenerated,
  isAnyProcessing,
  setSelectedGeneration,
  setBattleType,
  setShowingMilestone,
  setActiveTier,
  handlePokemonSelect,
  handleTripletSelectionComplete,
  goBack,
  handleContinueBattles,
  performFullBattleReset,
  handleSaveRankings,
  suggestRanking,
  removeSuggestion,
  resetMilestoneInProgress,
  handleManualReorder,
  onRankingsUpdate
}) => {
  console.log(`🎮 [RENDERER] BattleContentRenderer render`);

  const [rankingMode, setRankingMode] = useState<RankingMode>("battle");

  // Get all Pokemon from context for unified rankings
  const allPokemon = React.useMemo(() => {
    // Combine current battle, final rankings, and any other Pokemon sources
    const pokemonMap = new Map<number, Pokemon>();
    
    // Add from current battle
    currentBattle.forEach(p => pokemonMap.set(p.id, p));
    
    // Add from final rankings (these have TrueSkill data)
    finalRankings.forEach(p => pokemonMap.set(p.id, p));
    
    return Array.from(pokemonMap.values());
  }, [currentBattle, finalRankings]);

  const {
    allRankedPokemon,
    unrankedPokemon,
    addPokemonToRankings,
    reorderPokemon,
    updateFromBattleResults
  } = useUnifiedTrueSkillRankings(allPokemon);

  const {
    localPendingRefinements,
    markAsPending,
    updateFromProps
  } = usePendingRefinementsManager(new Set());

  // Sync unified rankings with external updates
  React.useEffect(() => {
    if (finalRankings.length > 0) {
      updateFromBattleResults(finalRankings);
    }
  }, [finalRankings, updateFromBattleResults]);

  // Enhanced manual reorder that updates both local and external state
  const handleUnifiedManualReorder = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🎮 [RENDERER] Unified manual reorder: ${draggedPokemonId} from ${sourceIndex} to ${destinationIndex}`);
    
    // Mark as pending
    markAsPending(draggedPokemonId);
    
    // Update unified rankings
    reorderPokemon(draggedPokemonId, sourceIndex, destinationIndex);
    
    // Also call original handler for compatibility
    if (handleManualReorder) {
      handleManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    }
  };

  const handleAddPokemonToUnifiedRankings = (pokemon: Pokemon, targetIndex: number) => {
    console.log(`🎮 [RENDERER] Adding Pokemon to unified rankings: ${pokemon.name} at index ${targetIndex}`);
    
    // Mark as pending
    markAsPending(pokemon.id);
    
    // Add to unified rankings
    addPokemonToRankings(pokemon, targetIndex);
  };

  // Render different content based on mode and state
  if (rankingMode === "manual") {
    return (
      <div className="space-y-4">
        <ImpliedBattleValidator />
        
        <BattleControls
          selectedGeneration={selectedGeneration}
          battleType={battleType}
          rankingMode={rankingMode}
          onGenerationChange={(gen) => setSelectedGeneration(Number(gen))}
          onBattleTypeChange={setBattleType}
          onRankingModeChange={setRankingMode}
          onReset={performFullBattleReset}
          battleHistory={battleHistory}
        />

        <ManualRankingMode
          rankedPokemon={allRankedPokemon}
          unrankedPokemon={unrankedPokemon}
          onAddPokemonToRankings={handleAddPokemonToUnifiedRankings}
          onReorderPokemon={reorderPokemon}
          pendingRefinements={localPendingRefinements}
        />
      </div>
    );
  }

  // Battle mode (existing logic)
  if (showingMilestone) {
    return (
      <div className="space-y-4">
        <ImpliedBattleValidator />
        
        <MilestoneView
          finalRankings={finalRankings}
          battlesCompleted={battlesCompleted}
          onContinueBattles={handleContinueBattles}
          onNewBattleSet={performFullBattleReset}
          rankingGenerated={rankingGenerated}
          onSaveRankings={handleSaveRankings}
          isMilestoneView={true}
          activeTier={activeTier}
          onTierChange={setActiveTier}
          onSuggestRanking={suggestRanking}
          onRemoveSuggestion={removeSuggestion}
          onManualReorder={handleUnifiedManualReorder}
          pendingRefinements={localPendingRefinements}
          enableDragAndDrop={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ImpliedBattleValidator />
      
      <BattleControls
        selectedGeneration={selectedGeneration}
        battleType={battleType}
        rankingMode={rankingMode}
        onGenerationChange={(gen) => setSelectedGeneration(Number(gen))}
        onBattleTypeChange={setBattleType}
        onRankingModeChange={setRankingMode}
        onReset={performFullBattleReset}
        battleHistory={battleHistory}
      />

      <BattleView
        currentBattle={currentBattle}
        selectedPokemon={selectedPokemon}
        battleType={battleType}
        isAnyProcessing={isAnyProcessing}
        onPokemonSelect={handlePokemonSelect}
        onTripletSelectionComplete={handleTripletSelectionComplete}
        onGoBack={goBack}
        battlesCompleted={battlesCompleted}
        milestones={milestones}
      />
    </div>
  );
};

export default BattleContentRenderer;
