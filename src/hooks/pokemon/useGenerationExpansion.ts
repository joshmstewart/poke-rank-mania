
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
      return newSet;
    });
  };

  const isGenerationExpanded = (generationId: number) => {
    return expandedGenerations.has(generationId);
  };

  const expandAll = () => {
    setExpandedGenerations(new Set(generations));
  };

  const collapseAll = () => {
    setExpandedGenerations(new Set());
  };

  const allExpanded = expandedGenerations.size === generations.length;
  const allCollapsed = expandedGenerations.size === 0;

  return {
    isGenerationExpanded,
    toggleGeneration,
    expandAll,
    collapseAll,
    allExpanded,
    allCollapsed
  };
};
