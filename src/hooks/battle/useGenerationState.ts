
import { useState, useEffect } from "react";

/**
 * Hook for managing the Pokemon generation state
 */
export const useGenerationState = () => {
  // Initialize with values from localStorage if available
  const storedGeneration = localStorage.getItem('pokemon-ranker-generation');
  const [selectedGeneration, setSelectedGeneration] = useState(
    storedGeneration ? Number(storedGeneration) : 0
  );

  // Sync localStorage with state changes
  useEffect(() => {
    if (selectedGeneration !== undefined) {
      localStorage.setItem('pokemon-ranker-generation', selectedGeneration.toString());
    }
  }, [selectedGeneration]);

  return {
    selectedGeneration,
    setSelectedGeneration
  };
};
