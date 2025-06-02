
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
  
  // Don't re-format names that should already be formatted
  const formattedRankings = React.useMemo(() => {
    if (!finalRankings || finalRankings.length === 0) {
      return [];
    }
    
    // Names should already be formatted at the source, so just return as-is
    return finalRankings;
  }, [finalRankings]);
  
  // Calculate how many items to show for milestone view based on tier
  const getMaxItemsForTier = useCallback(() => {
    if (activeTier === "All") {
      return formattedRankings.length;
    }
    const maxItems = Math.min(Number(activeTier), formattedRankings.length);
    return maxItems;
  }, [activeTier, formattedRankings.length]);

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
    setDisplayCount(newCount);
  };

  const handleMilestoneLoadMore = () => {
    const maxItems = getMaxItemsForTier();
    const newCount = Math.min(milestoneDisplayCount + 50, maxItems);
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
