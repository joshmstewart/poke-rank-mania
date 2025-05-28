
import React, { useState, useEffect, useCallback } from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";
import { formatPokemonName } from "@/utils/pokemon";
import MilestoneView from "./MilestoneView";
import DraggableMilestoneView from "./DraggableMilestoneView";
import StandardRankingView from "./StandardRankingView";

interface RankingDisplayProps {
  finalRankings: Pokemon[] | RankedPokemon[];
  battlesCompleted: number;
  onContinueBattles: () => void;
  onNewBattleSet: () => void;
  rankingGenerated: boolean;
  onSaveRankings: () => void;
  isMilestoneView?: boolean;
  activeTier?: TopNOption;
  onTierChange?: (tier: TopNOption) => void;
  onSuggestRanking?: (pokemon: RankedPokemon, direction: "up" | "down", strength: 1 | 2 | 3) => void;
  onRemoveSuggestion?: (pokemonId: number) => void;
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  pendingRefinements?: Set<number>;
  enableDragAndDrop?: boolean;
}

const RankingDisplay: React.FC<RankingDisplayProps> = ({
  finalRankings,
  battlesCompleted,
  onContinueBattles,
  onNewBattleSet,
  rankingGenerated,
  onSaveRankings,
  isMilestoneView = false,
  activeTier = 25,
  onTierChange,
  onSuggestRanking,
  onRemoveSuggestion,
  onManualReorder,
  pendingRefinements = new Set(),
  enableDragAndDrop = true
}) => {
  console.log("🟣 RankingDisplay component rendered with", finalRankings.length, "Pokémon");
  
  const [displayCount, setDisplayCount] = useState(20);
  const [milestoneDisplayCount, setMilestoneDisplayCount] = useState(50);
  
  // CRITICAL FIX: Format all Pokemon names before displaying
  const formattedRankings = React.useMemo(() => {
    console.log(`🔧 [MILESTONE_NAME_FIX] ===== FORMATTING ALL POKEMON NAMES =====`);
    
    const formatted = finalRankings.map((pokemon, index) => {
      const originalName = pokemon.name;
      const formattedName = formatPokemonName(originalName);
      
      console.log(`🔧 [MILESTONE_NAME_FIX] #${index + 1}: "${originalName}" → "${formattedName}"`);
      console.log(`🔧 [MILESTONE_NAME_FIX] Name changed: ${originalName !== formattedName}`);
      
      // Special logging for G-Max
      if (originalName.toLowerCase().includes('gmax')) {
        console.log(`🎯 [MILESTONE_GMAX_FIX] GMAX Pokemon detected: "${originalName}"`);
        console.log(`🎯 [MILESTONE_GMAX_FIX] Formatted to: "${formattedName}"`);
        console.log(`🎯 [MILESTONE_GMAX_FIX] Contains 'G-Max': ${formattedName.includes('G-Max')}`);
      }
      
      return {
        ...pokemon,
        name: formattedName
      };
    });
    
    console.log(`✅ [MILESTONE_NAME_FIX] Formatted ${formatted.length} Pokemon names for display`);
    console.log(`🔧 [MILESTONE_NAME_FIX] ===== END FORMATTING =====`);
    return formatted;
  }, [finalRankings]);
  
  // Calculate how many items to show for milestone view based on tier
  const getMaxItemsForTier = useCallback(() => {
    if (activeTier === "All") {
      return formattedRankings.length;
    }
    return Math.min(Number(activeTier), formattedRankings.length);
  }, [activeTier, formattedRankings.length]);

  // Add debugging to show Pokemon with types - this must be called unconditionally
  useEffect(() => {
    const displayRankings = formattedRankings.slice(0, displayCount);
    console.log("Pokemon list with types:");
    if (displayRankings.length > 0) {
      displayRankings.slice(0, Math.min(5, displayRankings.length)).forEach((pokemon, index) => {
        console.log(`${index + 1}. ${pokemon.name} (ID: ${pokemon.id}) - Types: ${pokemon.types?.join(', ') || 'unknown'}`);
        
        // ENHANCED DEBUGGING: Log the complete structure of the first Pokemon
        if (index === 0) {
          console.log("🔍 COMPLETE POKEMON STRUCTURE for", pokemon.name, ":");
          console.log("- Raw types property:", JSON.stringify(pokemon.types));
          console.log("- Types is array:", Array.isArray(pokemon.types));
          console.log("- Types length:", pokemon.types?.length || 0);
          console.log("- First type element:", pokemon.types?.[0]);
          console.log("- Type of first element:", typeof pokemon.types?.[0]);
          if (pokemon.types?.[0] && typeof pokemon.types[0] === 'object') {
            console.log("- First type object keys:", Object.keys(pokemon.types[0]));
            console.log("- First type object structure:", JSON.stringify(pokemon.types[0]));
          }
        }
      });
    }
  }, [formattedRankings, displayCount]);

  // Reset milestone display count when tier changes
  useEffect(() => {
    if (isMilestoneView) {
      setMilestoneDisplayCount(50);
    }
  }, [activeTier, isMilestoneView]);
  
  // Handler for the "Show More" button
  const handleShowMore = () => {
    const increment = 50;
    const newCount = Math.min(displayCount + increment, formattedRankings.length);
    console.log(`Increasing display count from ${displayCount} to ${newCount} of ${formattedRankings.length} total`);
    setDisplayCount(newCount);
  };

  const handleMilestoneLoadMore = () => {
    const maxItems = getMaxItemsForTier();
    setMilestoneDisplayCount(prev => Math.min(prev + 50, maxItems));
  };

  // Handle manual reordering
  const handleManualReorder = (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => {
    console.log(`🔄 [MANUAL_REORDER] Pokemon ${draggedPokemonId} moved from ${sourceIndex} to ${destinationIndex}`);
    
    if (onManualReorder) {
      onManualReorder(draggedPokemonId, sourceIndex, destinationIndex);
    }
  };

  // ULTRA-DETAILED MILESTONE NAME LOGGING
  if (isMilestoneView) {
    console.log(`🏆 [MILESTONE_ULTRA_DEBUG] ===== MILESTONE VIEW RENDERING =====`);
    console.log(`🏆 [MILESTONE_ULTRA_DEBUG] Total Pokemon in formattedRankings: ${formattedRankings.length}`);
    
    // Log first 5 Pokemon names in detail
    formattedRankings.slice(0, 5).forEach((pokemon, index) => {
      console.log(`🏆 [MILESTONE_ULTRA_DEBUG] Pokemon #${index + 1}:`);
      console.log(`🏆 [MILESTONE_ULTRA_DEBUG]   ID: ${pokemon.id}`);
      console.log(`🏆 [MILESTONE_ULTRA_DEBUG]   Name: "${pokemon.name}"`);
      console.log(`🏆 [MILESTONE_ULTRA_DEBUG]   Name type: ${typeof pokemon.name}`);
      console.log(`🏆 [MILESTONE_ULTRA_DEBUG]   Name length: ${pokemon.name.length}`);
      console.log(`🏆 [MILESTONE_ULTRA_DEBUG]   Contains hyphen: ${pokemon.name.includes('-')}`);
      console.log(`🏆 [MILESTONE_ULTRA_DEBUG]   Is formatted: ${!pokemon.name.includes('-') || pokemon.name.includes('(') || pokemon.name.includes('Mega ') || pokemon.name.includes('Alolan ') || pokemon.name.includes('G-Max ')}`);
      
      // Special check for G-Max
      if (pokemon.name.toLowerCase().includes('gmax') || pokemon.name.includes('G-Max')) {
        console.log(`🎯 [MILESTONE_GMAX_DEBUG] GMAX Pokemon in milestone: "${pokemon.name}"`);
        console.log(`🎯 [MILESTONE_GMAX_DEBUG]   Contains 'G-Max': ${pokemon.name.includes('G-Max')}`);
        console.log(`🎯 [MILESTONE_GMAX_DEBUG]   Contains 'gmax': ${pokemon.name.toLowerCase().includes('gmax')}`);
      }
    });
    console.log(`🏆 [MILESTONE_ULTRA_DEBUG] ===== END MILESTONE DEBUG =====`);
  }

  if (isMilestoneView) {
    // Use draggable milestone view if drag-and-drop is enabled
    if (enableDragAndDrop) {
      return (
        <DraggableMilestoneView
          formattedRankings={formattedRankings}
          battlesCompleted={battlesCompleted}
          activeTier={activeTier}
          milestoneDisplayCount={milestoneDisplayCount}
          onContinueBattles={onContinueBattles}
          onLoadMore={handleMilestoneLoadMore}
          getMaxItemsForTier={getMaxItemsForTier}
          onManualReorder={handleManualReorder}
          pendingRefinements={pendingRefinements}
        />
      );
    } else {
      // Fallback to original milestone view
      return (
        <MilestoneView
          formattedRankings={formattedRankings}
          battlesCompleted={battlesCompleted}
          activeTier={activeTier}
          milestoneDisplayCount={milestoneDisplayCount}
          onContinueBattles={onContinueBattles}
          onLoadMore={handleMilestoneLoadMore}
          getMaxItemsForTier={getMaxItemsForTier}
        />
      );
    }
  }

  return (
    <StandardRankingView
      formattedRankings={formattedRankings}
      displayCount={displayCount}
      battlesCompleted={battlesCompleted}
      rankingGenerated={rankingGenerated}
      onContinueBattles={onContinueBattles}
      onNewBattleSet={onNewBattleSet}
      onSaveRankings={onSaveRankings}
      onShowMore={handleShowMore}
    />
  );
};

export default RankingDisplay;
