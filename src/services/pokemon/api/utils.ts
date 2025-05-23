
import { Pokemon } from "../types";
import { PokemonImageType, getPreferredImageType, POKEMON_IMAGE_PREFERENCE_KEY, DEFAULT_IMAGE_PREFERENCE } from "@/components/settings/ImagePreferenceSelector";

// Function to get image URL based on preference with improved multi-step fallback handling
export function getPokemonImageUrl(id: number, fallbackLevel: number = 0): string {
  const preferredType = getPreferredImageType();
  
  // Define custom fallback chains based on initial preference
  const getFallbackOrder = (initialPreference: PokemonImageType): PokemonImageType[] => {
    switch(initialPreference) {
      case "official":
        // If user prefers official artwork, try Dream World next, then default
        return ["official", "dream", "default", "home"];
      case "dream":
        // If user prefers Dream World, try Official next, then default
        return ["dream", "official", "default", "home"];
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
    // Special case for certain Pokémon forms that have unique artwork
    if (
      // Crown forms, Eternal forms, special regional forms with unique art
      [898, 10195, 10196, 10197, 10198, 10199, 10200].includes(originalId) ||
      // Calyrex special forms 
      originalId === 10196 || originalId === 10197 || 
      // Specific Alolan forms exceptions that have their own artwork
      (originalId >= 10100 && originalId <= 10154)
    ) {
      return originalId; // Keep the original ID for these special forms
    }
    
    // For most other special forms, use the base form ID
    if (originalId >= 10000) {
      return originalId % 1000;
    }
    
    return originalId;
  };
  
  // Use normalized ID for image paths
  const normalizedId = normalizeImageId(id);
  
  // Generate URLs for each image type
  const getImageUrl = (type: PokemonImageType): string => {
    let url = "";
    
    switch(type) {
      case "official":
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
    
    return url;
  };

  // If we're at fallback level 0, always use the preferred type and ALWAYS generate a URL
  if (fallbackLevel === 0) {
    const url = getImageUrl(preferredType);
    return url;
  }
  
  // For fallbacks, get the appropriate type from our custom fallback chain
  // Ensure the fallback index doesn't go out of bounds
  const fallbackIndex = Math.min(fallbackLevel, fallbackChain.length - 1);
  const fallbackType = fallbackChain[fallbackIndex];
  const url = getImageUrl(fallbackType);
  
  // Make it very clear in logs which style is being used as fallback
  console.log(`🖼️ Pokémon #${id}: Original preference '${preferredType}' failed. Using fallback style '${fallbackType}', level: ${fallbackLevel} - URL: ${url}`);
  
  return url;
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
