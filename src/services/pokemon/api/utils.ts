
import { Pokemon } from "../types";
import { PokemonImageType, getPreferredImageType } from "@/components/settings/ImagePreferenceSelector";

// Function to get image URL based on preference with improved fallback handling
export function getPokemonImageUrl(id: number, fallbackLevel: number = 0): string {
  const preferredType = getPreferredImageType();
  
  // Generate URLs in order of preference
  const getImageUrl = (type: PokemonImageType): string => {
    switch(type) {
      case "official":
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
      case "home":
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
      case "dream":
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`;
      case "default":
      default:
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }
  };

  // List of all image types for fallbacks
  const allTypes: PokemonImageType[] = ["official", "home", "default", "dream"];
  
  // If we're at fallback level 0, use the preferred type
  if (fallbackLevel === 0) {
    return getImageUrl(preferredType);
  }
  
  // Otherwise, use fallbacks in a priority order, skipping the already-tried preferred type
  let fallbackTypes = [...allTypes];
  // Remove the preferred type from the list since it was already tried
  fallbackTypes = fallbackTypes.filter(type => type !== preferredType);
  
  // Add the preferred type at the end as a last resort (if everything else fails)
  fallbackTypes.push(preferredType);
  
  // Get the appropriate fallback
  const fallbackIndex = Math.min(fallbackLevel - 1, fallbackTypes.length - 1);
  return getImageUrl(fallbackTypes[fallbackIndex]);
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
      
      types = detailData.types.map((type: any) => type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1));
      
      if (isSpecialForm) {
        console.log(`Successfully fetched special form: ${name}`);
      }
    } else {
      console.warn(`Failed to fetch Pokemon details for #${id}, using fallback data`);
    }
  
    // Get species data for flavor text
    try {
      // For special forms, we need to get the base species (subtract 10000 and check for special cases)
      const speciesId = isSpecialForm ? Math.floor(id % 10000) : id;
      
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
