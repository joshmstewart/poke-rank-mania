import { Pokemon } from "../types";
import { PokemonImageType, getPreferredImageType, POKEMON_IMAGE_PREFERENCE_KEY, DEFAULT_IMAGE_PREFERENCE } from "@/components/settings/ImagePreferenceSelector";

// Image styles to cache busting map to track which ones needed cache busting
const imageCacheBustingMap = new Map<string, boolean>();

// Function to get image URL based on preference with improved multi-step fallback handling
export function getPokemonImageUrl(id: number, fallbackLevel: number = 0): string {
  const preferredType = getPreferredImageType();
  
  // Define custom fallback chains based on initial preference
  const getFallbackOrder = (initialPreference: PokemonImageType): PokemonImageType[] => {
    switch(initialPreference) {
      case "official":
        // If user prefers official artwork, try Dream World next, then Home, then default
        return ["official", "dream", "home", "default"];
      case "dream":
        // If user prefers Dream World, try Official next, then Home, then default
        return ["dream", "official", "home", "default"];
      case "home":
        // If user prefers Home, try Official next, then dream, then default
        return ["home", "official", "dream", "default"];
      case "default":
      default:
        // If user prefers default sprites, try higher quality options next
        return ["default", "official", "home", "dream"];
    }
  };
  
  // Get the appropriate fallback chain
  const fallbackChain = getFallbackOrder(preferredType);
  
  // Handle special form IDs by creating a normalized ID for image paths
  // This helps with form variants like Alolan, Galarian, etc.
  const normalizeImageId = (originalId: number): number => {
    // FIXED: Special form ID mapping for correct artwork paths
    // Define explicit special form mappings for commonly problematic Pokémon
    const specialFormMappings: Record<number, number> = {
      // Keldeo Resolute Form
      10024: 647, // Keldeo resolute (#10024) should map to Keldeo's base ID (#647)
      
      // Hisuian Avalugg form
      10243: 713, // Hisuian Avalugg (#10243) should map to Avalugg's base ID (#713)
      
      // Ho-Oh special case
      250: 250,
      
      // Paldean Tauros Combat Breed
      10250: 128,
      
      // Gourgeist
      10031: 711,
      
      // Sinistcha
      1013: 1013
    };
    
    // Check if we have an explicit mapping for this Pokémon ID
    if (specialFormMappings[originalId] !== undefined) {
      return specialFormMappings[originalId];
    }
    
    // Special case for Ho-Oh, which is ID 250
    if (originalId === 250) {
      return 250; // Always return 250 for Ho-Oh
    }
    
    // Special case for certain Pokémon forms that have unique artwork
    if (
      // Crown forms, Eternal forms, special regional forms with unique art
      [898, 10195, 10196, 10197, 10198, 10199, 10200].includes(originalId) ||
      // Calyrex special forms 
      originalId === 10196 || originalId === 10197 || 
      // Specific Alolan forms exceptions that have their own artwork
      (originalId >= 10100 && originalId <= 10154) ||
      // Galarian forms that have their own artwork in the API (special range)
      (originalId >= 10155 && originalId <= 10194)
    ) {
      return originalId; // Keep the original ID for these special forms
    }
    
    // FIXED: For other special forms with 10xxx IDs, extract the base ID properly
    if (originalId >= 10000) {
      // Most form IDs follow the convention 10xxx where xxx is the species number
      // However, some have different patterns
      
      // Handle Hisuian forms (typically 102xx range)
      if (originalId >= 10200 && originalId < 10300) {
        // Get the base species ID (subtract 10200 to get true ID)
        // For example: 10243 (Hisuian Avalugg) -> 43 is not correct 
        // We need a lookup table for these exceptions
        const hisuianBase = originalId - 10200;
        
        // Common Hisuian form mappings
        const hisuianMap: Record<number, number> = {
          28: 157,  // H-Typhlosion -> Typhlosion (157)
          37: 503,  // H-Samurott -> Samurott (503)
          43: 713,  // H-Avalugg -> Avalugg (713)
          58: 628,  // H-Braviary -> Braviary (628)
          // Add more mappings as needed
        };
        
        return hisuianMap[hisuianBase] || originalId % 1000;
      }
      
      // For other special forms (Alolan, Galarian, etc.)
      // Most IDs are in format 10xxx where xxx is the National Dex number
      const baseId = originalId % 10000;
      
      // Special cases for ID normalization
      if (baseId > 1000) {
        // For very high IDs, use modulo 1000 to get a more reasonable ID
        return baseId % 1000;
      }
      
      return baseId;
    }
    
    return originalId;
  };
  
  // Use normalized ID for image paths
  const normalizedId = normalizeImageId(id);
  
  // Log the original and normalized IDs for specific problematic Pokémon
  const problematicIds = [1013, 10024, 10031, 10093, 680, 10243];
  if (problematicIds.includes(id) && process.env.NODE_ENV === "development") {
    console.log(`🔍 [Problematic ID] Image URL for #${id} normalized to #${normalizedId}`);
  }
  
  // Generate URLs for each image type
  const getImageUrl = (type: PokemonImageType): string => {
    let url = "";
    
    switch(type) {
      case "official":
        // CRITICAL FIX: Always use the "other/official-artwork" path for official type
        // Never fallback to default sprite path for "official" type
        url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${normalizedId}.png`;
        break;
      case "home":
        url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${normalizedId}.png`;
        break;
      case "dream":
        url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${normalizedId}.svg`;
        break;
      case "default":
      default:
        url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${normalizedId}.png`;
        break;
    }
    
    // Add cache busting if this URL has been marked as needing it
    const urlKey = `${type}-${normalizedId}`;
    if (imageCacheBustingMap.get(urlKey)) {
      url = `${url}?_cb=${Date.now()}`;
    }
    
    return url;
  };

  // Log the original and normalized IDs to help diagnose
  if (id !== normalizedId && process.env.NODE_ENV === "development") {
    console.log(`🔄 Image ID normalization: Original ID ${id} → Normalized ID ${normalizedId}`);
  }

  // If we're at fallback level 0, use the preferred type
  if (fallbackLevel === 0) {
    // Pre-check if we should immediately use a fallback based on known problematic IDs
    // This helps prevent the initial image load failure
    if (preferredType === "official") {
      // For Pokémon beyond Gen 8 (ID > 898), official artwork might be less reliable
      if (id > 1010 || (id > 10000 && !([10100, 10101, 10102].includes(id)))) {
        // Log this only in development
        if (process.env.NODE_ENV === "development") {
          console.log(`ℹ️ Using cache busting for newer Pokémon #${id} with pre-emptive cache busting`);
        }
        
        // We'll still try official artwork first but with cache busting
        const officialUrl = getImageUrl("official");
        
        // Mark this as needing cache busting for future loads
        markImageAsNeedingCacheBusting(id, "official");
        
        return `${officialUrl}?_cb=${Date.now()}`;
      }
      
      // For Galarian forms (ID range 10155-10194), often official artwork is missing
      if (id >= 10155 && id <= 10194) {
        if (process.env.NODE_ENV === "development") {
          console.log(`ℹ️ Using pre-emptive cache busting for Galarian form #${id} official artwork`);
        }
        const officialUrl = getImageUrl("official");
        
        // Mark this as needing cache busting for future loads
        markImageAsNeedingCacheBusting(id, "official");
        
        return `${officialUrl}?_cb=${Date.now()}`;
      }
      
      // For Hisuian forms (ID range 10200-10299), often need special handling
      if (id >= 10200 && id <= 10299) {
        if (process.env.NODE_ENV === "development") {
          console.log(`ℹ️ Using pre-emptive cache busting for Hisuian form #${id} official artwork`);
        }
        const officialUrl = getImageUrl("official");
        
        // Mark this as needing cache busting for future loads
        markImageAsNeedingCacheBusting(id, "official");
        
        return `${officialUrl}?_cb=${Date.now()}`;
      }
    }
    
    // For most Pokémon, use the preferred style
    return getImageUrl(preferredType);
  }
  
  // For fallbacks, get the appropriate type from our custom fallback chain
  // Ensure the fallback index doesn't go out of bounds
  const fallbackIndex = Math.min(fallbackLevel, fallbackChain.length - 1);
  const fallbackType = fallbackChain[fallbackIndex];
  const url = getImageUrl(fallbackType);
  
  // Make it very clear in logs which style is being used as fallback
  if (process.env.NODE_ENV === "development") {
    console.log(`🖼️ Pokémon #${id}: Original preference '${preferredType}' failed. Using fallback style '${fallbackType}', level: ${fallbackLevel} - URL: ${url}`);
  }
  
  return url;
}

/**
 * Mark an image URL as needing cache busting for future loads
 * This helps with GitHub's raw content CDN sometimes serving stale images
 */
export function markImageAsNeedingCacheBusting(pokemonId: number, imageType: PokemonImageType): void {
  // Special case for Hisuian forms (10200-10299)
  let normalizedId;
  if (pokemonId >= 10200 && pokemonId < 10300) {
    normalizedId = Math.floor(pokemonId / 100);
  } else {
    normalizedId = pokemonId > 10000 ? pokemonId % 1000 : pokemonId;
  }
  
  const urlKey = `${imageType}-${normalizedId}`;
  
  imageCacheBustingMap.set(urlKey, true);
  
  if (process.env.NODE_ENV === "development") {
    console.log(`🧹 Marked image as needing cache busting: ${urlKey}`);
  }
}

// Function to fetch detailed Pokemon information
export async function fetchPokemonDetails(id: number): Promise<Pokemon> {
  // Get detailed Pokemon data
  let name = `Pokemon #${id}`;
  let types: string[] = [];
  let flavorText = "";
  
  try {
    // First check if this is a special form Pokémon (by checking if it's beyond the standard National Dex)
    const isSpecialForm = id > 10000;
    
    // For special forms, we need to handle them differently
    if (isSpecialForm) {
      console.log(`Fetching special form Pokémon with ID: ${id}`);
    }
    
    const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      name = detailData.name.charAt(0).toUpperCase() + detailData.name.slice(1);
      
      // Convert dashes to spaces in the name for better readability
      name = name.replace(/-/g, ' ');
      
      // Get types and ensure they're properly formatted (capitalized)
      types = detailData.types.map((type: any) => 
        type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
      );
      
      // Apply formatPokemonName for special forms like Alolan variants
      if (name.toLowerCase().includes('alola') || name.toLowerCase().includes('galar') ||
          name.toLowerCase().includes('hisui') || name.toLowerCase().includes('paldea')) {
        // We'll handle this at the display level with formatPokemonName
      }
      
      if (isSpecialForm) {
        console.log(`Successfully fetched special form: ${name} with types: ${types.join(', ')}`);
      }
    } else {
      console.warn(`Failed to fetch Pokemon details for #${id}, using fallback data`);
    }
  
    // Get species data for flavor text
    try {
      // For special forms, we need to get the base species (subtract 10000 and check for special cases)
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
  
    // Get preferred image URL
    const imageUrl = getPokemonImageUrl(id);

    // Special case handling for Paldean Tauros Combat Breed (ID 10250)
    if (id === 10250) {
      return {
        id: id,
        name: "Paldean Tauros Combat Breed",
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
    // Return minimal Pokemon info on error
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
  // Fix known problematic cases
  return pokemon.map(p => {
    // Clone to avoid mutating the original
    const fixedPokemon = { ...p };
    
    // Special case for ID 10250 which should be Paldean Tauros but might have wrong image
    if (p.id === 10250 && !p.name.toLowerCase().includes('tauros')) {
      console.log(`📌 Fixing Paldean Tauros (ID: ${p.id}) with incorrect name: ${p.name}`);
      fixedPokemon.name = "Paldean Tauros Combat Breed";
      fixedPokemon.image = getPokemonImageUrl(128); // Use base Tauros image
    }
    
    // Special case for Ho-Oh (ID 250) which might be showing wrong name
    if (p.id === 250 && !p.name.toLowerCase().includes('ho-oh')) {
      console.log(`📌 Fixing Ho-oh (ID: ${p.id}) with incorrect name: ${p.name}`);
      fixedPokemon.name = "Ho-Oh";
      fixedPokemon.image = getPokemonImageUrl(250);
    }
    
    // Special case for Gourgeist (ID 10031)
    if (p.id === 10031 && !p.image.includes('711')) {
      console.log(`📌 Fixing Gourgeist (ID: ${p.id}) with incorrect image: ${p.image}`);
      fixedPokemon.image = getPokemonImageUrl(10031);
    }
    
    // Special case for Sinistcha (ID 1013)
    if (p.id === 1013) {
      console.log(`📌 Ensuring Sinistcha (ID: ${p.id}) has correct image URL`);
      fixedPokemon.image = getPokemonImageUrl(1013);
    }
    
    // Check if the image URL and ID match (basic validation)
    const normalizedId = p.id > 10000 ? p.id % 1000 : p.id;
    const includesId = fixedPokemon.image.includes(`${normalizedId}`) || 
                      // Also check for special cases where the ID might be different
                      (p.id === 10031 && fixedPokemon.image.includes('711')) ||
                      (p.id === 10250 && fixedPokemon.image.includes('128'));
                      
    if (!includesId) {
      console.log(`⚠️ Image URL doesn't match Pokemon ID for ${p.name} (ID: ${p.id}). URL: ${p.image}`);
      fixedPokemon.image = getPokemonImageUrl(p.id);
    }
    
    return fixedPokemon;
  });
}
