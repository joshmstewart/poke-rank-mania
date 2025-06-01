
import React, { useState, useMemo, useEffect } from "react";

export const useGenerationExpansion = () => {
  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(new Set());

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

  return {
    expandedGenerations,
    isGenerationExpanded,
    toggleGeneration,
    expandAll,
    collapseAll
  };
};
