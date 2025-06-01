import { Pokemon } from "@/services/pokemon";
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
  colorsFlavors: 0
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
  colorsFlavors: []
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
    colorsFlavors: 0
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
    colorsFlavors: []
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

// FIXED: Check if Pokemon has the literal word "starter" in its name
export const isStarterPokemon = (pokemon: Pokemon): boolean => {
  return pokemon.name.toLowerCase().includes('starter');
};

// Check if Pokemon is a totem variant (always exclude)
export const isTotemPokemon = (pokemon: Pokemon): boolean => {
  return pokemon.name.toLowerCase().includes('totem');
};

// Check if Pokemon is a size variant (always exclude)
export const isSizeVariantPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  return name.includes('small') || name.includes('large') || name.includes('super') ||
         (name.includes('pumpkaboo') && (name.includes('small') || name.includes('large') || name.includes('super'))) ||
         (name.includes('gourgeist') && (name.includes('small') || name.includes('large') || name.includes('super')));
};

// Check if Pokemon is a special Koraidon/Miraidon mode (always exclude)
export const isSpecialKoraidonMiraidonMode = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  return (name.includes('koraidon') || name.includes('miraidon')) && 
         (name.includes('limited') || name.includes('build') || name.includes('mode'));
};

// FIXED: Much more precise categorization that only catches actual form variants
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  const name = pokemon.name.toLowerCase();
  const originalName = pokemon.name; // Keep original for logging
  let category: PokemonFormType | null = null;
  
  // CRITICAL FIX: Only catch Pokemon that have a hyphen AND the form indicator comes AFTER the hyphen
  // This prevents base Pokemon names from being miscategorized
  
  // Regional forms (must have hyphen and regional indicator after it)
  if (name.includes('-alolan') || name.includes('-galarian') || name.includes('-hisuian') || name.includes('-paldean') ||
      name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea')) {
    category = 'regional';
  }
  // Mega and Gigantamax forms (must have hyphen and mega/gmax indicator)
  else if (name.includes('-mega') || name.includes('-gmax') || name.includes('-gigantamax')) {
    category = 'megaGmax';
  }
  // Origin and Primal forms (must have hyphen and origin/primal after it)
  else if (name.includes('-origin') || name.includes('-primal')) {
    category = 'originPrimal';
  }
  // Gender differences (specific patterns only)
  else if (name.includes('-male') || name.includes('-female') || name.includes('-m') || name.includes('-f') ||
           name === 'nidoran-f' || name === 'nidoran-m' || // Special cases
           name.includes('♂') || name.includes('♀')) {
    category = 'gender';
  }
  // Costume Pokemon (ONLY Pikachu variants and specific costume indicators)
  else if ((name.includes('pikachu') && (name.includes('-cap') || name.includes('-hat') || name.includes('-costume') ||
           name.includes('-libre') || name.includes('-phd') || name.includes('-pop-star') || name.includes('-rock-star') ||
           name.includes('-belle') || name.includes('-cosplay') || name.includes('-original') || name.includes('-hoenn') ||
           name.includes('-sinnoh') || name.includes('-unova') || name.includes('-kalos') || name.includes('-alola') ||
           name.includes('-partner') || name.includes('-world') || name.includes('-ash'))) ||
           // Other specific costume cases
           name.includes('-costume') || name.includes('-hat')) {
    category = 'costumes';
  }
  // Colors and flavors (ONLY specific Pokemon with known color/flavor variants after hyphen)
  else if (
    // Oricorio forms
    (name.includes('oricorio') && (name.includes('-baile') || name.includes('-pom-pom') || name.includes('-pau') || name.includes('-sensu'))) ||
    // Basculin forms  
    (name.includes('basculin') && (name.includes('-red-striped') || name.includes('-blue-striped'))) ||
    // Toxtricity forms
    (name.includes('toxtricity') && (name.includes('-amped') || name.includes('-low-key'))) ||
    // Urshifu forms
    (name.includes('urshifu') && (name.includes('-single-strike') || name.includes('-rapid-strike'))) ||
    // Kyurem forms
    (name.includes('kyurem') && (name.includes('-black') || name.includes('-white'))) ||
    // Squawkabilly forms
    (name.includes('squawkabilly') && name.includes('-plumage')) ||
    // Minior core colors (not meteor forms which are excluded)
    (name.includes('minior') && !name.includes('meteor') && 
     (name.includes('-red') || name.includes('-orange') || name.includes('-yellow') || 
      name.includes('-green') || name.includes('-blue') || name.includes('-indigo') || name.includes('-violet')))
  ) {
    category = 'colorsFlavors';
  }
  // Special forms (ONLY specific known form variants with hyphen indicators)
  else if (
    // Rotom forms
    (name.includes('rotom') && (name.includes('-heat') || name.includes('-wash') || name.includes('-frost') || 
     name.includes('-fan') || name.includes('-mow'))) ||
    // Shaymin forms
    (name.includes('shaymin') && name.includes('-sky')) ||
    // Giratina forms
    (name.includes('giratina') && (name.includes('-altered') || name.includes('-origin'))) ||
    // Deoxys forms
    (name.includes('deoxys') && (name.includes('-normal') || name.includes('-attack') || name.includes('-defense') || name.includes('-speed'))) ||
    // Wormadam forms
    (name.includes('wormadam') && (name.includes('-plant') || name.includes('-sandy') || name.includes('-trash'))) ||
    // Castform forms
    (name.includes('castform') && (name.includes('-sunny') || name.includes('-rainy') || name.includes('-snowy'))) ||
    // Cherrim forms
    (name.includes('cherrim') && name.includes('-sunshine')) ||
    // Arceus forms (with plate types)
    (name.includes('arceus') && name.includes('-')) ||
    // Other specific form indicators
    name.includes('-blade') || name.includes('-shield') || name.includes('-confined') || name.includes('-unbound') ||
    name.includes('-complete') || name.includes('-crowned') || name.includes('-eternamax') ||
    name.includes('-dusk') || name.includes('-dawn') || name.includes('-ultra') || name.includes('-zen') ||
    name.includes('-therian') || name.includes('-incarnate') || name.includes('-aria') || name.includes('-pirouette') ||
    name.includes('-ordinary') || name.includes('-resolute') || name.includes('-solo') || name.includes('-school') ||
    name.includes('-disguised') || name.includes('-busted')
  ) {
    category = 'forms';
  }
  // Default to normal if no special form detected
  else {
    category = 'normal';
  }
  
  // Update stats and track ALL examples (remove the 20-item limit)
  if (category) {
    categoryStats[category]++;
    
    // Track ALL examples for complete debugging
    miscategorizedExamples[category].push(`${originalName} (${pokemon.id})`);
    
    // Log specific problematic cases for debugging
    if (category === 'colorsFlavors' && !name.includes('-')) {
      console.log(`🚨 [COLORS_NO_HYPHEN] "${originalName}" (ID: ${pokemon.id}) categorized as colorsFlavors without hyphen`);
    }
    if (category === 'forms' && !name.includes('-')) {
      console.log(`🚨 [FORMS_NO_HYPHEN] "${originalName}" (ID: ${pokemon.id}) categorized as forms without hyphen`);
    }
    if (category === 'costumes' && !name.includes('pikachu') && !name.includes('-costume') && !name.includes('-hat')) {
      console.log(`🚨 [COSTUME_UNEXPECTED] "${originalName}" (ID: ${pokemon.id}) categorized as costume unexpectedly`);
    }
  }
  
  return category;
};
