
// Map of Pokemon types to colors
export const typeColors: Record<string, string> = {
  // All lowercase versions
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-blue-200",
  fighting: "bg-red-700",
  poison: "bg-purple-600",
  ground: "bg-yellow-700",
  flying: "bg-indigo-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-stone-500",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-600",
  dark: "bg-stone-800 text-white",
  steel: "bg-slate-400",
  fairy: "bg-pink-300",
  
  // All capitalized versions
  Normal: "bg-gray-400",
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Electric: "bg-yellow-400",
  Grass: "bg-green-500",
  Ice: "bg-blue-200",
  Fighting: "bg-red-700",
  Poison: "bg-purple-600",
  Ground: "bg-yellow-700",
  Flying: "bg-indigo-300",
  Psychic: "bg-pink-500",
  Bug: "bg-lime-500",
  Rock: "bg-stone-500",
  Ghost: "bg-purple-700",
  Dragon: "bg-indigo-600",
  Dark: "bg-stone-800 text-white",
  Steel: "bg-slate-400",
  Fairy: "bg-pink-300",
};

// Color mapping by Pokemon ID as fallback when types are missing
export const typeColorsByPokemonId: Record<number, string> = {
  // Gen 1 starters and popular Pokemon
  1: typeColors.grass,    // Bulbasaur: Grass
  4: typeColors.fire,     // Charmander: Fire
  7: typeColors.water,    // Squirtle: Water
  10: typeColors.bug,     // Caterpie: Bug
  25: typeColors.electric, // Pikachu: Electric
  82: typeColors.electric, // Magneton: Electric/Steel
  129: typeColors.water,   // Magikarp: Water
  133: typeColors.normal,  // Eevee: Normal
  150: typeColors.psychic, // Mewtwo: Psychic

  // Gen 2
  152: typeColors.grass,   // Chikorita: Grass
  155: typeColors.fire,    // Cyndaquil: Fire
  157: typeColors.fire,    // Typhlosion: Fire
  158: typeColors.water,   // Totodile: Water
  235: typeColors.normal,  // Smeargle: Normal

  // Gen 3
  252: typeColors.grass,   // Treecko: Grass
  255: typeColors.fire,    // Torchic: Fire
  258: typeColors.water,   // Mudkip: Water
  384: typeColors.dragon,  // Rayquaza: Dragon/Flying

  // Gen 4
  387: typeColors.grass,   // Turtwig: Grass
  390: typeColors.fire,    // Chimchar: Fire
  393: typeColors.water,   // Piplup: Water
  407: typeColors.grass,   // Roserade: Grass/Poison
  489: typeColors.water,   // Phione: Water

  // Gen 5
  495: typeColors.grass,   // Snivy: Grass
  497: typeColors.grass,   // Serperior: Grass
  498: typeColors.fire,    // Tepig: Fire
  501: typeColors.water,   // Oshawott: Water
  506: typeColors.normal,  // Lillipup: Normal
  533: typeColors.fighting, // Gurdurr: Fighting
  599: typeColors.steel,   // Klink: Steel

  // Gen 7
  750: typeColors.ground,  // Mudsdale: Ground

  // Gen 9
  934: typeColors.rock,    // Garganacl: Rock
  958: typeColors.steel,   // Tinkatuff: Fairy/Steel
  980: typeColors.poison,  // Clodsire: Poison/Ground
  1004: typeColors.fire,   // Chi-yu: Fire/Dark
};

// Helper function to get Pokemon type color with better error handling
export const getPokemonTypeColor = (pokemon: any) => {
  try {
    // First, use the type-based approach if types exist
    if (pokemon.types && pokemon.types.length) {
      // Get primary type (first in the array)
      const primaryType = pokemon.types[0];
      
      // Check if we have this type in our map
      if (primaryType && typeof primaryType === 'string') {
        // Debug the type matching
        console.log(`Finding color for ${pokemon.name} primary type: "${primaryType}" (typeof: ${typeof primaryType})`);
        
        // Try exact match first
        if (typeColors[primaryType]) {
          console.log(`✅ Found exact match for type "${primaryType}": ${typeColors[primaryType]}`);
          return typeColors[primaryType];
        }
        
        // Normalize type to lowercase for consistent lookup
        const normalizedType = primaryType.toLowerCase();
        console.log(`Trying normalized type "${normalizedType}"`);
        
        // Look up the color with normalized type
        const color = typeColors[normalizedType];
        
        if (color) {
          console.log(`✅ Found color using normalized type "${normalizedType}": ${color}`);
          return color;
        }
      }
    }
    
    // Fallback to ID-based color mapping if types not available
    if (typeColorsByPokemonId[pokemon.id]) {
      console.log(`🔄 Using ID-based fallback for ${pokemon.name} (ID: ${pokemon.id})`);
      return typeColorsByPokemonId[pokemon.id];
    }
    
    // Last resort - use ID modulo to assign a consistent color from our palette
    const colorKeys = Object.keys(typeColors);
    const colorIndex = pokemon.id % colorKeys.length;
    const fallbackType = colorKeys[colorIndex];
    console.log(`⚠️ Using ID modulo fallback for ${pokemon.name}: ${fallbackType}`);
    return typeColors[fallbackType] || "bg-gray-200";
    
  } catch (err) {
    console.error(`Error getting type color for ${pokemon.name}:`, err);
    return "bg-gray-200"; // Default color on error
  }
};
