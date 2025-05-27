import { Pokemon } from "../types";
import { PokemonImageType, getPreferredImageType, POKEMON_IMAGE_PREFERENCE_KEY, DEFAULT_IMAGE_PREFERENCE } from "@/components/settings/ImagePreferenceSelector";
import { formatPokemonName } from "@/utils/pokemonUtils";

// Image styles to cache busting map to track which ones needed cache busting
const imageCacheBustingMap = new Map<string, boolean>();

// Function to get image URL based on preference with improved multi-step fallback handling
export function getPokemonImageUrl(id: number, fallbackLevel: number = 0): string {
  const preferredType = getPreferredImageType();
  
  // Define custom fallback chains based on initial preference
  const getFallbackOrder = (initialPreference: PokemonImageType): PokemonImageType[] => {
    switch(initialPreference) {
      case "official":
        return ["official", "dream", "home", "default"];
      case "dream":
        return ["dream", "official", "home", "default"];
      case "home":
        return ["home", "official", "dream", "default"];
      case "default":
      default:
        return ["default", "official", "home", "dream"];
    }
  };
  
  // Get the appropriate fallback chain
  const fallbackChain = getFallbackOrder(preferredType);
  
  // FIXED: Comprehensive special form mappings and artwork strategy
  const getCorrectArtworkId = (originalId: number): number => {
    // Strategy: For special forms, try their specific ID first, then fallback to base if needed
    
    // Mapping for special forms that should DEFINITELY use base species artwork
    // (when the special form artwork doesn't exist or isn't visually distinct)
    const forceBaseSpeciesMappings: Record<number, number> = {
      // Only add here if the special form truly has no distinct artwork
      // or should always show base species artwork for visual consistency
    };
    
    // Check if we have an explicit base species mapping
    if (forceBaseSpeciesMappings[originalId] !== undefined) {
      console.log(`🔄 Using base species mapping: #${originalId} -> #${forceBaseSpeciesMappings[originalId]}`);
      return forceBaseSpeciesMappings[originalId];
    }
    
    // For most special forms with IDs >= 10000, try the specific ID first
    // This ensures forms like Kyurem Black (#10022) use their own artwork
    if (originalId >= 10000) {
      console.log(`🔄 Using specific form artwork for special form ID: #${originalId}`);
      return originalId;
    }
    
    return originalId;
  };

  // Use the correct artwork ID strategy
  const artworkId = getCorrectArtworkId(id);
  
  // Log the original and artwork IDs for debugging
  if (id !== artworkId) {
    console.log(`🔄 Image ID strategy: Original ID ${id} → Artwork ID ${artworkId}`);
  }
  
  // Generate URLs for each image type - FIXED: Ensure valid hostnames only
  const getImageUrl = (type: PokemonImageType): string => {
    let url = "";
    
    // CRITICAL FIX: Ensure we only use valid PokeAPI URLs
    const baseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
    
    switch(type) {
      case "official":
        url = `${baseUrl}/other/official-artwork/${artworkId}.png`;
        break;
      case "home":
        url = `${baseUrl}/other/home/${artworkId}.png`;
        break;
      case "dream":
        url = `${baseUrl}/other/dream-world/${artworkId}.svg`;
        break;
      case "default":
      default:
        url = `${baseUrl}/${artworkId}.png`;
        break;
    }
    
    // Add cache busting if this URL has been marked as needing it
    const urlKey = `${type}-${artworkId}`;
    if (imageCacheBustingMap.get(urlKey)) {
      url = `${url}?_cb=${Date.now()}`;
    }
    
    // CRITICAL: Validate URL before returning
    try {
      new URL(url);
      return url;
    } catch (error) {
      console.error(`❌ Invalid URL constructed: ${url}`);
      // Fallback to a basic default URL
      return `${baseUrl}/${artworkId}.png`;
    }
  };

  // If we're at fallback level 0, use the preferred type
  if (fallbackLevel === 0) {
    return getImageUrl(preferredType);
  }
  
  // For fallbacks, get the appropriate type from our custom fallback chain
  const fallbackIndex = Math.min(fallbackLevel, fallbackChain.length - 1);
  const fallbackType = fallbackChain[fallbackIndex];
  const url = getImageUrl(fallbackType);
  
  console.log(`🖼️ Pokémon #${id}: Original preference '${preferredType}' failed. Using fallback style '${fallbackType}', level: ${fallbackLevel} - URL: ${url}`);
  
  return url;
}

/**
 * Mark an image URL as needing cache busting for future loads
 */
export function markImageAsNeedingCacheBusting(pokemonId: number, imageType: PokemonImageType): void {
  const artworkId = pokemonId >= 10000 ? pokemonId : pokemonId;
  const urlKey = `${imageType}-${artworkId}`;
  
  imageCacheBustingMap.set(urlKey, true);
  
  console.log(`🧹 Marked image as needing cache busting: ${urlKey}`);
}

// Function to fetch detailed Pokemon information
export async function fetchPokemonDetails(id: number): Promise<Pokemon> {
  let name = `Pokemon #${id}`;
  let types: string[] = [];
  let flavorText = "";
  
  try {
    const isSpecialForm = id > 10000;
    
    if (isSpecialForm) {
      console.log(`Fetching special form Pokémon with ID: ${id}`);
    }
    
    const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      // CRITICAL FIX: Apply formatPokemonName immediately to the raw API name
      const rawApiName = detailData.name.charAt(0).toUpperCase() + detailData.name.slice(1).replace(/-/g, ' ');
      name = formatPokemonName(rawApiName);
      console.log(`🔧 [NAME_TRANSFORM_FIX] Raw API: "${detailData.name}" → Capitalized: "${rawApiName}" → Final: "${name}"`);
      
      types = detailData.types.map((type: any) => 
        type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
      );
      
      if (isSpecialForm) {
        console.log(`Successfully fetched special form: ${name} with types: ${types.join(', ')}`);
      }
    } else {
      console.warn(`Failed to fetch Pokemon details for #${id}, using fallback data`);
    }
  
    // Get species data for flavor text
    try {
      const speciesId = isSpecialForm ? Math.floor(id % 1000) : id;
      
      const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`);
      if (speciesResponse.ok) {
        const speciesData = await speciesResponse.json();
        const englishFlavorText = speciesData.flavor_text_entries.find(
          (entry: any) => entry.language.name === "en"
        );
        flavorText = englishFlavorText 
          ? englishFlavorText.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\r/g, " ")
          : "";
      }
    } catch (speciesError) {
      console.warn(`Failed to fetch species data for Pokemon #${id}:`, speciesError);
    }
  
    const imageUrl = getPokemonImageUrl(id);

    if (id === 10250) {
      return {
        id: id,
        name: "Paldean Tauros (Combat Breed)",
        image: imageUrl,
        types,
        flavorText
      };
    }

    return {
      id: Number(id),
      name: name,
      image: imageUrl,
      types,
      flavorText
    };
  } catch (error) {
    console.error(`Error fetching details for Pokemon #${id}:`, error);
    return {
      id: Number(id),
      name: name,
      image: getPokemonImageUrl(id),
      types,
      flavorText: ""
    };
  }
}

// Function to ensure battle Pokemon IDs and images/names match correctly
export function validateBattlePokemon(pokemon: Pokemon[]): Pokemon[] {
  return pokemon.map(p => {
    const fixedPokemon = { ...p };
    
    // CRITICAL FIX: DO NOT re-transform names here - they should already be correctly formatted
    // Only handle very specific edge cases that need manual correction
    
    // Special case for ID 10250 which should be Paldean Tauros
    if (p.id === 10250 && !p.name.toLowerCase().includes('tauros')) {
      console.log(`📌 Fixing Paldean Tauros (ID: ${p.id}) with incorrect name: ${p.name}`);
      fixedPokemon.name = "Paldean Tauros (Combat Breed)";
      fixedPokemon.image = getPokemonImageUrl(10250);
    }
    
    // Special case for Ho-Oh (ID 250)
    if (p.id === 250 && !p.name.toLowerCase().includes('ho-oh')) {
      console.log(`📌 Fixing Ho-oh (ID: ${p.id}) with incorrect name: ${p.name}`);
      fixedPokemon.name = "Ho-Oh";
      fixedPokemon.image = getPokemonImageUrl(250);
    }
    
    // For other special forms, ensure correct image URL but DON'T change the name
    if (p.id >= 10000) {
      console.log(`📌 Ensuring special form (ID: ${p.id}) "${p.name}" has correct image URL`);
      fixedPokemon.image = getPokemonImageUrl(p.id);
    }
    
    return fixedPokemon;
  });
}
