
import { toast } from "@/hooks/use-toast";
import { Pokemon, ITEMS_PER_PAGE } from "../types";
import { generations } from "../data";
import { fetchPokemonDetails } from "./utils";

// Function to fetch paginated Pokemon
export async function fetchPaginatedPokemon(
  generationId: number = 0, 
  page: number = 1
): Promise<{pokemon: Pokemon[], totalPages: number}> {
  try {
    const selectedGeneration = generations.find(gen => gen.id === generationId) || generations[0];
    let totalPokemon = selectedGeneration.end - selectedGeneration.start + 1;
    
    // For "All Generations", make sure we're not artificially limiting the total
    if (generationId === 0) {
      // There are more than 1000 Pokemon in total (as of latest generation)
      totalPokemon = Math.max(totalPokemon, 1010); 
    }
    
    const totalPages = Math.ceil(totalPokemon / ITEMS_PER_PAGE);
    
    // Calculate offset and limit based on page and generation
    let offset, limit;
    
    if (generationId === 0) {
      // For all generations, use direct pagination with the PokeAPI
      offset = (page - 1) * ITEMS_PER_PAGE;
      limit = ITEMS_PER_PAGE;
    } else {
      // For specific generations, calculate offset from generation start
      offset = selectedGeneration.start - 1 + ((page - 1) * ITEMS_PER_PAGE);
      limit = Math.min(ITEMS_PER_PAGE, selectedGeneration.end - offset + 1);
    }
    
    console.log(`Fetching Pokemon: generation=${generationId}, page=${page}, offset=${offset}, limit=${limit}, totalPages=${totalPages}`);
    
    // Fetch the Pokemon list for the current page
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Pokemon');
    }
    
    const data = await response.json();
    
    // If we received fewer results than expected and we're not at the end of the generation range,
    // it means we've reached the actual end of the PokeAPI data
    if (data.results.length === 0 && page > 1) {
      console.log("No more Pokemon available from API");
      return { pokemon: [], totalPages: page - 1 };
    }
    
    const pokemonList = await Promise.all(
      data.results.map(async (pokemon: { name: string; url: string }) => {
        const pokemonId = pokemon.url.split('/').filter(Boolean).pop();
        return fetchPokemonDetails(Number(pokemonId));
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
