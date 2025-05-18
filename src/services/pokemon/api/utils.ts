
import { Pokemon } from "../types";

// Function to fetch detailed Pokemon information
export async function fetchPokemonDetails(id: number): Promise<Pokemon> {
  // Get detailed Pokemon data
  let name = `Pokemon #${id}`;
  let types: string[] = [];
  let flavorText = "";
  
  try {
    const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      name = detailData.name.charAt(0).toUpperCase() + detailData.name.slice(1);
      types = detailData.types.map((type: any) => type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1));
    } else {
      console.warn(`Failed to fetch Pokemon details for #${id}, using fallback data`);
    }
  
    // Get species data for flavor text
    try {
      const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
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
  
    // Prepare the best image URL - try to use official artwork when available
    const imageUrls = [
      // Default image (sprite)
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      // Official artwork (higher quality when available)
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
    ];

    // Use the first URL that works
    let imageUrl = imageUrls[0]; // Default to the first option

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
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      types,
      flavorText: ""
    };
  }
}
