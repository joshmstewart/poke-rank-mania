
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

  return {
    isGenerationExpanded,
    toggleGeneration
  };
};
