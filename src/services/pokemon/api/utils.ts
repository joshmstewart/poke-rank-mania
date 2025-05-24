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
  
  // Handle special form IDs by creating a normalized ID for image paths
  const normalizeImageId = (originalId: number): number => {
    // FIXED: Comprehensive special form mappings for correct artwork paths
    const specialFormMappings: Record<number, number> = {
      // Keldeo forms
      10024: 647, // Keldeo Resolute Form -> Keldeo base (#647)
      
      // Hisuian forms
      10243: 713, // Hisuian Avalugg -> Avalugg base (#713)
      10217: 215, // Hisuian Sneasel -> Sneasel base (#215) 
      10230: 58,  // Hisuian Growlithe -> Growlithe base (#58)
      10233: 211, // Hisuian Qwilfish -> Qwilfish base (#211)
      
      // Paldean forms
      10250: 128, // Paldean Tauros Combat Breed -> Tauros base (#128)
      10251: 128, // Paldean Tauros Blaze Breed -> Tauros base (#128)
      10252: 128, // Paldean Tauros Aqua Breed -> Tauros base (#128)
      
      // Gourgeist forms
      10031: 711, // Gourgeist Super Size -> Gourgeist base (#711)
      10032: 711, // Gourgeist Large Size -> Gourgeist base (#711)
      10033: 711, // Gourgeist Small Size -> Gourgeist base (#711)
      
      // Other special cases
      10093: 666, // Vivillon forms -> Vivillon base (#666)
      
      // Megas that should use base form artwork
      10034: 3,   // Mega Venusaur -> Venusaur (#3)
      10035: 6,   // Mega Charizard X -> Charizard (#6)
      10036: 6,   // Mega Charizard Y -> Charizard (#6)
      10037: 9,   // Mega Blastoise -> Blastoise (#9)
      
      // Alolan forms
      10100: 26,  // Alolan Raichu -> Raichu base (#26)
      10101: 27,  // Alolan Sandshrew -> Sandshrew base (#27)
      10102: 28,  // Alolan Sandslash -> Sandslash base (#28)
      10103: 37,  // Alolan Vulpix -> Vulpix base (#37)
      10104: 38,  // Alolan Ninetales -> Ninetales base (#38)
      
      // Galarian forms
      10155: 77,  // Galarian Ponyta -> Ponyta base (#77)
      10156: 78,  // Galarian Rapidash -> Rapidash base (#78)
      10157: 52,  // Galarian Meowth -> Meowth base (#52)
      10158: 83,  // Galarian Farfetch'd -> Farfetch'd base (#83)
    };
    
    // Check if we have an explicit mapping for this Pokémon ID
    if (specialFormMappings[originalId] !== undefined) {
      console.log(`🔄 Special form mapping: #${originalId} -> #${specialFormMappings[originalId]}`);
      return specialFormMappings[originalId];
    }
    
    // Special case for Ho-Oh, which is ID 250
    if (originalId === 250) {
      return 250; // Always return 250 for Ho-Oh
    }
    
    // For newer generation Pokémon (Gen 9+), keep original ID if it's under 2000
    if (originalId >= 906 && originalId < 2000) {
      return originalId;
    }
    
    // Special case for certain Pokémon forms that have unique artwork
    if (
      // Crown forms, Eternal forms, special regional forms with unique art
      [898, 10195, 10196, 10197, 10198, 10199, 10200].includes(originalId) ||
      // Calyrex special forms 
      originalId === 10196 || originalId === 10197 || 
      // Specific forms that should keep their unique ID
      (originalId >= 10100 && originalId <= 10154 && ![10100, 10101, 10102, 10103, 10104].includes(originalId))
    ) {
      return originalId;
    }
    
    // For other special forms with 10xxx IDs
    if (originalId >= 10000) {
      // Extract the base species ID
      const baseId = originalId % 1000;
      
      // For IDs that result in very low numbers, use a different approach
      if (baseId < 50 && originalId > 10200) {
        // This is likely a Hisuian form in the 102xx range
        return originalId; // Keep original for now, should be caught by mapping above
      }
      
      return baseId;
    }
    
    return originalId;
  };
  
  // Use normalized ID for image paths
  const normalizedId = normalizeImageId(id);
  
  // Log the original and normalized IDs for debugging
  if (id !== normalizedId) {
    console.log(`🔄 Image ID normalization: Original ID ${id} → Normalized ID ${normalizedId}`);
  }
  
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
    
    // Add cache busting if this URL has been marked as needing it
    const urlKey = `${type}-${normalizedId}`;
    if (imageCacheBustingMap.get(urlKey)) {
      url = `${url}?_cb=${Date.now()}`;
    }
    
    return url;
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
  const normalizedId = pokemonId > 10000 ? pokemonId % 1000 : pokemonId;
  const urlKey = `${imageType}-${normalizedId}`;
  
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
      name = detailData.name.charAt(0).toUpperCase() + detailData.name.slice(1);
      name = name.replace(/-/g, ' ');
      
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
    
    // Special case for ID 10250 which should be Paldean Tauros
    if (p.id === 10250 && !p.name.toLowerCase().includes('tauros')) {
      console.log(`📌 Fixing Paldean Tauros (ID: ${p.id}) with incorrect name: ${p.name}`);
      fixedPokemon.name = "Paldean Tauros Combat Breed";
      fixedPokemon.image = getPokemonImageUrl(128);
    }
    
    // Special case for Ho-Oh (ID 250)
    if (p.id === 250 && !p.name.toLowerCase().includes('ho-oh')) {
      console.log(`📌 Fixing Ho-oh (ID: ${p.id}) with incorrect name: ${p.name}`);
      fixedPokemon.name = "Ho-Oh";
      fixedPokemon.image = getPokemonImageUrl(250);
    }
    
    // Special case for Keldeo Resolute (ID 10024)
    if (p.id === 10024) {
      console.log(`📌 Ensuring Keldeo Resolute (ID: ${p.id}) has correct image URL`);
      fixedPokemon.image = getPokemonImageUrl(10024); // This will now map to 647 correctly
    }
    
    // Special case for Hisuian Avalugg (ID 10243)
    if (p.id === 10243) {
      console.log(`📌 Ensuring Hisuian Avalugg (ID: ${p.id}) has correct image URL`);
      fixedPokemon.image = getPokemonImageUrl(10243); // This will now map to 713 correctly
    }
    
    return fixedPokemon;
  });
}
