
import { Pokemon } from "../types";

// Function to fetch detailed Pokemon information
export async function fetchPokemonDetails(id: number): Promise<Pokemon> {
  // Get detailed Pokemon data
  let name = `Pokemon #${id}`;
  let types: string[] = [];
  
  try {
    const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      name = detailData.name.charAt(0).toUpperCase() + detailData.name.slice(1);
      types = detailData.types.map((type: any) => type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1));
    }
  
    // Get species data for flavor text
    let flavorText = "";
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
  
    return {
      id: Number(id),
      name: name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
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
