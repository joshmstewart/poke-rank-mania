
import { toast } from "@/hooks/use-toast";
import { Pokemon, ITEMS_PER_PAGE } from "../types";
import { generations } from "../data";

// Function to fetch paginated Pokemon
export async function fetchPaginatedPokemon(
  generationId: number = 0, 
  page: number = 1
): Promise<{pokemon: Pokemon[], totalPages: number}> {
  try {
    const selectedGeneration = generations.find(gen => gen.id === generationId) || generations[0];
    const totalPokemon = selectedGeneration.end - selectedGeneration.start + 1;
    const totalPages = Math.ceil(totalPokemon / ITEMS_PER_PAGE);
    
    // Calculate offset and limit based on page
    const offset = selectedGeneration.start - 1 + ((page - 1) * ITEMS_PER_PAGE);
    const limit = Math.min(ITEMS_PER_PAGE, selectedGeneration.end - offset);
    
    // Fetch the Pokemon list for the current page
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Pokemon');
    }
    
    const data = await response.json();
    
    const pokemonList = await Promise.all(
      data.results.map(async (pokemon: { name: string; url: string }) => {
        const pokemonId = pokemon.url.split('/').filter(Boolean).pop();
        
        // Get detailed Pokemon data
        const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        let types: string[] = [];
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          types = detailData.types.map((type: any) => type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1));
        }
        
        // Get species data for flavor text
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
        let flavorText = "";
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
          id: Number(pokemonId),
          name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
          types,
          flavorText
        };
      })
    );
    
    return {
      pokemon: pokemonList,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    toast({
      title: "Error",
      description: "Failed to fetch Pokemon. Please try again.",
      variant: "destructive"
    });
    return { pokemon: [], totalPages: 0 };
  }
}
