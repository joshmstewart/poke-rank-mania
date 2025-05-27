
import { Pokemon } from "../types";
import { formatPokemonName } from "@/utils/pokemon";
import { getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";

/**
 * Validates and ensures Pokemon have consistent image URLs and names for battle display
 */
export const validateBattlePokemon = (pokemon: Pokemon[]): Pokemon[] => {
  console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Input Pokemon count: ${pokemon.length}`);
  console.log(`🔍 [VALIDATE_BATTLE_POKEMON] DETAILED INPUT ANALYSIS:`);
  
  pokemon.forEach((p, index) => {
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Input #${index}:`);
    console.log(`   - Raw name: "${p.name}"`);
    console.log(`   - ID: ${p.id}`);
    console.log(`   - Name contains hyphen: ${p.name.includes('-')}`);
    console.log(`   - Name is lowercase: ${p.name === p.name.toLowerCase()}`);
    console.log(`   - Looks like raw API name: ${p.name.includes('-') && p.name === p.name.toLowerCase()}`);
  });
  
  const validated = pokemon.map((p, index) => {
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Processing #${index}: "${p.name}" (ID: ${p.id})`);
    
    // CRITICAL ANALYSIS: Check if this name looks like it needs formatting
    const looksLikeRawName = p.name.includes('-') && p.name === p.name.toLowerCase();
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Name "${p.name}" looks like raw API name: ${looksLikeRawName}`);
    
    let finalName;
    if (looksLikeRawName) {
      // This name appears to be unformatted - apply formatting
      finalName = formatPokemonName(p.name);
      console.log(`🔍 [VALIDATE_BATTLE_POKEMON] FORMATTING APPLIED: "${p.name}" → "${finalName}"`);
    } else {
      // This name appears to already be formatted - preserve it
      finalName = p.name;
      console.log(`🔍 [VALIDATE_BATTLE_POKEMON] NAME PRESERVED (already formatted): "${finalName}"`);
    }
    
    const validatedPokemon = {
      ...p,
      name: finalName,
      // Ensure image exists
      image: p.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
    };
    
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Output #${index}: "${validatedPokemon.name}" (ID: ${validatedPokemon.id})`);
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Final name change: "${p.name}" → "${validatedPokemon.name}"`);
    
    return validatedPokemon;
  });
  
  console.log(`✅ [VALIDATE_BATTLE_POKEMON] Validated ${validated.length} Pokemon with smart name handling`);
  return validated;
};

/**
 * Get the preferred image URL for a Pokemon based on user preference with fallback chain
 */
export const getPokemonImageUrl = (pokemonId: number, fallbackLevel: number = 0): string => {
  const preferredType = getPreferredImageType();
  
  // Define the image type options with fallback chains
  const imageTypes: { [key in PokemonImageType]: string[] } = {
    official: [
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonId}.svg`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
    ],
    home: [
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonId}.svg`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
    ],
    dream: [
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonId}.svg`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
    ],
    default: [
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
    ]
  };

  const urls = imageTypes[preferredType] || imageTypes.default;
  const urlIndex = Math.min(fallbackLevel, urls.length - 1);
  
  return urls[urlIndex];
};

/**
 * Mark an image as needing cache busting for future loads
 */
export const markImageAsNeedingCacheBusting = (pokemonId: number, imageType: PokemonImageType): void => {
  // Store in localStorage for persistence
  const key = `pokemon-image-cache-bust-${pokemonId}-${imageType}`;
  localStorage.setItem(key, Date.now().toString());
};

/**
 * Fetch detailed Pokemon data from the API
 */
export const fetchPokemonDetails = async (pokemonId: number): Promise<Pokemon> => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon ${pokemonId}`);
  }
  
  const pokemonData = await response.json();
  
  const pokemon: Pokemon = {
    id: pokemonData.id,
    name: formatPokemonName(pokemonData.name),
    image: getPokemonImageUrl(pokemonData.id),
    types: pokemonData.types.map((type: any) => 
      type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
    ),
    height: pokemonData.height,
    weight: pokemonData.weight,
    stats: pokemonData.stats.reduce((acc: any, stat: any) => {
      acc[stat.stat.name] = stat.base_stat;
      return acc;
    }, {}),
    generation: Math.ceil(pokemonData.id / 151) || 1
  };
  
  return pokemon;
};
