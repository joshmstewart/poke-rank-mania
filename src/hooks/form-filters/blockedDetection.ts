
import { Pokemon } from "@/services/pokemon";

// FIXED: Check if Pokemon is a starter by ID ranges and specific IDs
export const isStarterPokemon = (pokemon: Pokemon): boolean => {
  // Original starters from each generation by ID
  const starterIds = [
    // Gen 1: Bulbasaur, Ivysaur, Venusaur, Charmander, Charmeleon, Charizard, Squirtle, Wartortle, Blastoise
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    // Gen 2: Chikorita, Bayleef, Meganium, Cyndaquil, Quilava, Typhlosion, Totodile, Croconaw, Feraligatr
    152, 153, 154, 155, 156, 157, 158, 159, 160,
    // Gen 3: Treecko, Grovyle, Sceptile, Torchic, Combusken, Blaziken, Mudkip, Marshtomp, Swampert
    252, 253, 254, 255, 256, 257, 258, 259, 260,
    // Gen 4: Turtwig, Grotle, Torterra, Chimchar, Monferno, Infernape, Piplup, Prinplup, Empoleon
    387, 388, 389, 390, 391, 392, 393, 394, 395,
    // Gen 5: Snivy, Servine, Serperior, Tepig, Pignite, Emboar, Oshawott, Dewott, Samurott
    495, 496, 497, 498, 499, 500, 501, 502, 503,
    // Gen 6: Chespin, Quilladin, Chesnaught, Fennekin, Braixen, Delphox, Froakie, Frogadier, Greninja
    650, 651, 652, 653, 654, 655, 656, 657, 658,
    // Gen 7: Rowlet, Dartrix, Decidueye, Litten, Torracat, Incineroar, Popplio, Brionne, Primarina
    722, 723, 724, 725, 726, 727, 728, 729, 730,
    // Gen 8: Grookey, Thwackey, Rillaboom, Scorbunny, Raboot, Cinderace, Sobble, Drizzile, Inteleon
    810, 811, 812, 813, 814, 815, 816, 817, 818,
    // Gen 9: Sprigatito, Floragato, Meowscarada, Fuecoco, Crocalor, Skeledirge, Quaxly, Quaxwell, Quaquaval
    906, 907, 908, 909, 910, 911, 912, 913, 914
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
         (name.includes('limited') || name.includes('build') || name.includes('mode'));
};

// ENHANCED: More comprehensive blocked Pokemon detection
export const isBlockedPokemon = (pokemon: Pokemon): boolean => {
  const name = pokemon.name.toLowerCase();
  
  // Check various blocking conditions
  const isBlocked = isStarterPokemon(pokemon) || 
         isTotemPokemon(pokemon) || 
         isSizeVariantPokemon(pokemon) || 
         isSpecialKoraidonMiraidonMode(pokemon) ||
         (name.includes('minior') && name.includes('meteor')) ||
         (name.includes('cramorant') && name !== 'cramorant') ||
         // Additional blocked patterns
         name.includes('-cap') || // Pikachu caps that might be missed
         name.includes('shadow') || // Shadow Pokemon
         name.includes('purified') || // Purified Pokemon
         name.includes('clone') || // Clone Pokemon
         name.includes('copy'); // Copy Pokemon
  
  if (isBlocked) {
    console.log(`🚫 [BLOCKED_DETECTION] "${pokemon.name}" (ID: ${pokemon.id}) detected as blocked`);
  }
  
  return isBlocked;
};
