
import { useState, useMemo } from "react";

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
    console.log(`🔍 [GENERATION_EXPANSION] Expanding all generations`);
    setExpandedGenerations(new Set(generations));
  };

  const collapseAll = () => {
    console.log(`🔍 [GENERATION_EXPANSION] Collapsing all generations`);
    setExpandedGenerations(new Set());
  };

  const allExpanded = expandedGenerations.size === generations.length;
  const allCollapsed = expandedGenerations.size === 0;

  console.log(`🔍 [GENERATION_EXPANSION] Current state: ${expandedGenerations.size}/${generations.length} expanded`);

  return {
    isGenerationExpanded,
    toggleGeneration,
    expandAll,
    collapseAll,
    allExpanded,
    allCollapsed
  };
};
