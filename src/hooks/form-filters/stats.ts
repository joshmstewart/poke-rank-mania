
import { PokemonFormType } from "./types";

// CRITICAL: Log form category distribution for debugging
let categoryStats: Record<PokemonFormType, number> = {
  normal: 0,
  megaGmax: 0,
  regional: 0,
  gender: 0,
  forms: 0,
  originPrimal: 0,
  costumes: 0,
  colorsFlavors: 0,
  blocked: 0
};

// NEW: Track miscategorized Pokemon for debugging
let miscategorizedExamples: Record<PokemonFormType, string[]> = {
  normal: [],
  megaGmax: [],
  regional: [],
  gender: [],
  forms: [],
  originPrimal: [],
  costumes: [],
  colorsFlavors: [],
  blocked: []
};

export const resetCategoryStats = () => {
  categoryStats = {
    normal: 0,
    megaGmax: 0,
    regional: 0,
    gender: 0,
    forms: 0,
    originPrimal: 0,
    costumes: 0,
    colorsFlavors: 0,
    blocked: 0
  };
  
  // Reset examples
  miscategorizedExamples = {
    normal: [],
    megaGmax: [],
    regional: [],
    gender: [],
    forms: [],
    originPrimal: [],
    costumes: [],
    colorsFlavors: [],
    blocked: []
  };
};

export const getCategoryStats = () => ({ ...categoryStats });

export const getMiscategorizedExamples = () => ({ ...miscategorizedExamples });

export const logCategoryStats = () => {
  console.log(`📊 [FORM_CATEGORY_STATS] Current distribution:`, categoryStats);
  const total = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
  console.log(`📊 [FORM_CATEGORY_STATS] Total categorized: ${total}`);
  
  // Show percentages
  Object.entries(categoryStats).forEach(([category, count]) => {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    console.log(`📊 [FORM_CATEGORY_STATS] ${category}: ${count} (${percentage}%)`);
  });
  
  // NEW: Log examples of miscategorized Pokemon
  console.log(`🔍 [MISCATEGORIZED_EXAMPLES] Examples by category:`);
  Object.entries(miscategorizedExamples).forEach(([category, examples]) => {
    if (examples.length > 0) {
      console.log(`🔍 [MISCATEGORIZED_EXAMPLES] ${category} (${examples.length}): ${examples.slice(0, 10).join(', ')}${examples.length > 10 ? '...' : ''}`);
    }
  });
};

export const updateCategoryStats = (category: PokemonFormType, pokemonName: string, pokemonId: number) => {
  categoryStats[category]++;
  miscategorizedExamples[category].push(`${pokemonName} (${pokemonId})`);
  
  // Enhanced logging for blocked Pokemon
  if (category === 'blocked') {
    console.log(`🚫 [BLOCKED_POKEMON_FINAL] "${pokemonName}" (ID: ${pokemonId}) FINAL categorization: blocked`);
  }
};
