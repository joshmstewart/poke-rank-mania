
import { Pokemon } from "../types";
import { formatPokemonName } from "@/utils/pokemon";
import { getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";

/**
 * Validates and ensures Pokemon have consistent image URLs and names for battle display
 */
export const validateBattlePokemon = (pokemon: Pokemon[]): Pokemon[] => {
  console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Input Pokemon count: ${pokemon.length}`);
  
  const validated = pokemon.map((p, index) => {
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Input #${index}: "${p.name}" (ID: ${p.id})`);
    
    // CRITICAL FIX: DO NOT modify the name - use it exactly as provided from the API
    const validatedPokemon = {
      ...p,
      // Keep the name exactly as it was formatted by the API
      name: p.name,
      // Ensure image exists
      image: p.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
    };
    
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Output #${index}: "${validatedPokemon.name}" (ID: ${validatedPokemon.id})`);
    
    return validatedPokemon;
  });
  
  console.log(`✅ [VALIDATE_BATTLE_POKEMON] Validated ${validated.length} Pokemon - names preserved exactly as input`);
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
