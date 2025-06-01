
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
};

export const getCategoryStats = () => ({ ...categoryStats });

export const logCategoryStats = () => {
  console.log(`📊 [FORM_CATEGORY_STATS] Current distribution:`, categoryStats);
  const total = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
  console.log(`📊 [FORM_CATEGORY_STATS] Total categorized: ${total}`);
  
  // Show percentages
  Object.entries(categoryStats).forEach(([category, count]) => {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    console.log(`📊 [FORM_CATEGORY_STATS] ${category}: ${count} (${percentage}%)`);
  });
};

// Check if Pokemon is a starter (always exclude)
export const isStarterPokemon = (pokemon: Pokemon): boolean => {
  const starterIds = [
    // Gen 1
    1, 4, 7, // Bulbasaur, Charmander, Squirtle
    // Gen 2
    152, 155, 158, // Chikorita, Cyndaquil, Totodile
    // Gen 3
    252, 255, 258, // Treecko, Torchic, Mudkip
    // Gen 4
    387, 390, 393, // Turtwig, Chimchar, Piplup
    // Gen 5
    495, 498, 501, // Snivy, Tepig, Oshawott
    // Gen 6
    650, 653, 656, // Chespin, Fennekin, Froakie
    // Gen 7
    722, 725, 728, // Rowlet, Litten, Popplio
    // Gen 8
    810, 813, 816, // Grookey, Scorbunny, Sobble
    // Gen 9
    906, 909, 912, // Sprigatito, Fuecoco, Quaxly
  ];
  
  return starterIds.includes(pokemon.id);
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
         (name.includes('apex') || name.includes('limited') || name.includes('build') || name.includes('mode'));
};

// Main categorization function
export const getPokemonFormCategory = (pokemon: Pokemon): PokemonFormType | null => {
  const name = pokemon.name.toLowerCase();
  let category: PokemonFormType | null = null;
  
  // Regional forms (Alolan, Galarian, Hisuian, Paldean)
  if (name.includes('alolan') || name.includes('galarian') || name.includes('hisuian') || name.includes('paldean') ||
      name.includes('alola') || name.includes('galar') || name.includes('hisui') || name.includes('paldea')) {
    category = 'regional';
  }
  // Mega and Gigantamax forms
  else if (name.includes('mega') || name.includes('gmax') || name.includes('gigantamax')) {
    category = 'megaGmax';
  }
  // Origin and Primal forms
  else if (name.includes('origin') || name.includes('primal')) {
    category = 'originPrimal';
  }
  // Gender differences (male/female variants)
  else if (name.includes('male') || name.includes('female') || name.includes('-m') || name.includes('-f') ||
           name.includes('♂') || name.includes('♀')) {
    category = 'gender';
  }
  // Costume Pokemon (caps, costumes, etc.)
  else if (name.includes('cap') || name.includes('costume') || name.includes('hat') || name.includes('libre') ||
           name.includes('phd') || name.includes('pop-star') || name.includes('rock-star') || name.includes('belle')) {
    category = 'costumes';
  }
  // Colors and flavors (specific color/flavor variants)
  else if (name.includes('red') || name.includes('blue') || name.includes('yellow') || name.includes('green') ||
           name.includes('orange') || name.includes('indigo') || name.includes('violet') || name.includes('white') ||
           name.includes('black') || name.includes('brown') || name.includes('pink') || name.includes('gray') ||
           name.includes('strawberry') || name.includes('love') || name.includes('star') || name.includes('rainbow') ||
           name.includes('flower') || name.includes('diamond') || name.includes('heart') || name.includes('clover') ||
           name.includes('minior') || name.includes('oricorio') || name.includes('lycanroc') ||
           name.includes('toxtricity') || name.includes('urshifu') || name.includes('basculin')) {
    category = 'colorsFlavors';
  }
  // Special forms (other form differences)
  else if (name.includes('sky') || name.includes('speed') || name.includes('attack') || name.includes('defense') ||
           name.includes('plant') || name.includes('sandy') || name.includes('trash') || name.includes('frost') ||
           name.includes('heat') || name.includes('wash') || name.includes('fan') || name.includes('mow') ||
           name.includes('altered') || name.includes('resolute') || name.includes('ordinary') || name.includes('pirouette') ||
           name.includes('blade') || name.includes('shield') || name.includes('confined') || name.includes('unbound') ||
           name.includes('complete') || name.includes('meteor') || name.includes('crowned') || name.includes('eternamax') ||
           name.includes('ice') || name.includes('shadow') || name.includes('dusk') || name.includes('dawn') ||
           name.includes('ultra') || name.includes('dusk') || name.includes('original') || name.includes('zen') ||
           name.includes('therian') || name.includes('incarnate') || name.includes('aria') || name.includes('step')) {
    category = 'forms';
  }
  // Default to normal if no special form detected
  else {
    category = 'normal';
  }
  
  // Update stats
  if (category) {
    categoryStats[category]++;
  }
  
  return category;
};
