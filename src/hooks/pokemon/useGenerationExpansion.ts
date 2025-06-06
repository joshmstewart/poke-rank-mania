
import React, { useState, useMemo, useEffect } from "react";

export const useGenerationExpansion = () => {
  // CRITICAL FIX: Default to expanded state - start with all generations expanded
  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(() => {
    // Initialize with generations 1-9 all expanded by default
    return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  const toggleGeneration = (generationId: number) => {
    setExpandedGenerations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(generationId)) {
        newSet.delete(generationId);
      } else {
        newSet.add(generationId);
      }
      console.log(`🔍 [GENERATION_EXPANSION] Toggled generation ${generationId}, now expanded: ${!prev.has(generationId)}`);
      return newSet;
    });
  };

  const isGenerationExpanded = (generationId: number) => {
    return expandedGenerations.has(generationId);
  };

  const expandAll = (generations: number[]) => {
    console.log(`🔍 [GENERATION_EXPANSION] Expanding all generations:`, generations);
    setExpandedGenerations(new Set(generations));
  };

  const collapseAll = () => {
    console.log(`🔍 [GENERATION_EXPANSION] Collapsing all generations`);
    setExpandedGenerations(new Set<number>());
  };

  const expandGenerations = (generations: number[]) => {
    setExpandedGenerations(prev => {
      const newSet = new Set(prev);
      generations.forEach(gen => newSet.add(gen));
      console.log(`🔍 [GENERATION_EXPANSION] Expanding specific generations:`, generations);
      return newSet;
    });
  };

  return {
    expandedGenerations,
    isGenerationExpanded,
    toggleGeneration,
    expandAll,
    collapseAll,
    expandGenerations
  };
};
