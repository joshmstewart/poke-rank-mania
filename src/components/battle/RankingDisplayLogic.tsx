
import React, { useState, useEffect, useCallback } from "react";
import { Pokemon, TopNOption, RankedPokemon } from "@/services/pokemon";

interface UseRankingDisplayLogicProps {
  finalRankings: Pokemon[] | RankedPokemon[];
  isMilestoneView?: boolean;
  activeTier?: TopNOption;
}

export const useRankingDisplayLogic = ({
  finalRankings,
  isMilestoneView = false,
  activeTier = 25
}: UseRankingDisplayLogicProps) => {
  const [displayCount, setDisplayCount] = useState(20);
  const [milestoneDisplayCount, setMilestoneDisplayCount] = useState(50);
  
  console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] ===== useRankingDisplayLogic called =====`);
  console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Input finalRankings length: ${finalRankings?.length || 0}`);
  console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] isMilestoneView: ${isMilestoneView}`);
  console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] activeTier: ${activeTier}`);
  
  // UPDATED: Don't re-format names that should already be formatted
  const formattedRankings = React.useMemo(() => {
    console.log(`🔧 [RANKING_DISPLAY_LOGIC_FIXED] ===== USING PRE-FORMATTED POKEMON NAMES =====`);
    console.log(`🔧 [RANKING_DISPLAY_LOGIC_FIXED] Input rankings length: ${finalRankings?.length || 0}`);
    
    if (!finalRankings || finalRankings.length === 0) {
      console.log(`🚨 [RANKING_DISPLAY_LOGIC_FIXED] No rankings to display - returning empty array`);
      return [];
    }
    
    // Names should already be formatted at the source, so just return as-is
    console.log(`✅ [RANKING_DISPLAY_LOGIC_FIXED] Using pre-formatted ${finalRankings.length} Pokemon names`);
    console.log(`🔧 [RANKING_DISPLAY_LOGIC_FIXED] Sample names:`, finalRankings.slice(0, 3).map(p => `${p.name} (${p.id})`));
    
    return finalRankings;
  }, [finalRankings]);
  
  console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Formatted rankings length: ${formattedRankings.length}`);
  
  // Calculate how many items to show for milestone view based on tier
  const getMaxItemsForTier = useCallback(() => {
    if (activeTier === "All") {
      console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Tier 'All' - returning all ${formattedRankings.length} items`);
      return formattedRankings.length;
    }
    const maxItems = Math.min(Number(activeTier), formattedRankings.length);
    console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Tier '${activeTier}' - returning ${maxItems} items`);
    return maxItems;
  }, [activeTier, formattedRankings.length]);

  // Add debugging to show Pokemon with types - this must be called unconditionally
  useEffect(() => {
    const displayRankings = formattedRankings.slice(0, displayCount);
    console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Pokemon list with types (first 5):`);
    if (displayRankings.length > 0) {
      displayRankings.slice(0, Math.min(5, displayRankings.length)).forEach((pokemon, index) => {
        console.log(`${index + 1}. ${pokemon.name} (ID: ${pokemon.id}) - Types: ${pokemon.types?.join(', ') || 'unknown'}`);
      });
    } else {
      console.log(`🚨 [RANKING_DISPLAY_LOGIC_DEBUG] No display rankings available`);
    }
  }, [formattedRankings, displayCount]);

  // Reset milestone display count when tier changes
  useEffect(() => {
    if (isMilestoneView) {
      console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Resetting milestone display count for tier change`);
      setMilestoneDisplayCount(50);
    }
  }, [activeTier, isMilestoneView]);
  
  // Handler for the "Show More" button
  const handleShowMore = () => {
    const increment = 50;
    const newCount = Math.min(displayCount + increment, formattedRankings.length);
    console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Increasing display count from ${displayCount} to ${newCount} of ${formattedRankings.length} total`);
    setDisplayCount(newCount);
  };

  const handleMilestoneLoadMore = () => {
    const maxItems = getMaxItemsForTier();
    const newCount = Math.min(milestoneDisplayCount + 50, maxItems);
    console.log(`🔧 [RANKING_DISPLAY_LOGIC_DEBUG] Milestone load more: ${milestoneDisplayCount} → ${newCount} (max: ${maxItems})`);
    setMilestoneDisplayCount(newCount);
  };

  return {
    formattedRankings,
    displayCount,
    milestoneDisplayCount,
    getMaxItemsForTier,
    handleShowMore,
    handleMilestoneLoadMore
  };
};
