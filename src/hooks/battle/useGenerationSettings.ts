
import { useState, useEffect } from "react";
import { generations } from "@/services/pokemon";

// Simplified version of the hook that only needs to provide generation name
export const useGenerationSettings = (selectedGeneration: number) => {
  // Find the generation name from the generation ID
  const generationName = (() => {
    const gen = generations.find(g => g.id === selectedGeneration);
    return gen ? gen.name : "Unknown Generation";
  })();
  
  return {
    generationName
  };
};
