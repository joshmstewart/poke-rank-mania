import React, { useState, useMemo, useEffect } from "react";

export const useGenerationExpansion = (generations: number[]) => {
  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(() => {
    // Start with all generations expanded
    return new Set(generations);
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

  const expandAll = () => {
    console.log(`🔍 [GENERATION_EXPANSION] Expanding all generations:`, generations);
    setExpandedGenerations(new Set(generations));
  };

  const collapseAll = () => {
    console.log(`🔍 [GENERATION_EXPANSION] Collapsing all generations`);
    setExpandedGenerations(new Set<number>());
  };

  // Update the expanded generations when the available generations change
  useEffect(() => {
    setExpandedGenerations(prev => {
      // Keep only the generations that still exist and add any new ones
      const newSet = new Set<number>();
      generations.forEach(gen => {
        if (prev.has(gen) || prev.size === generations.length) {
          newSet.add(gen);
        }
      });
      // If we had all generations expanded before, expand all new ones too
      if (prev.size === 0) {
        return new Set<number>(); // Keep collapsed state
      }
      return newSet.size === 0 ? new Set<number>(generations) : newSet;
    });
  }, [generations]);

  const allExpanded = expandedGenerations.size === generations.length && generations.length > 0;
  const allCollapsed = expandedGenerations.size === 0;

  console.log(`🔍 [GENERATION_EXPANSION] Current state: ${expandedGenerations.size}/${generations.length} expanded`);
  console.log(`🔍 [GENERATION_EXPANSION] Available generations:`, generations);
  console.log(`🔍 [GENERATION_EXPANSION] Expanded generations:`, Array.from(expandedGenerations));

  return {
    isGenerationExpanded,
    toggleGeneration,
    expandAll,
    collapseAll,
    allExpanded,
    allCollapsed
  };
};
