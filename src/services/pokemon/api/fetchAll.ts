
import { toast } from "@/hooks/use-toast";
import { Pokemon } from "../types";
import { generations } from "../data";
import { fetchPokemonDetails } from "./utils";

// Helper function to check if a Pokemon should be included based on current form filters
const shouldIncludePokemon = (pokemon: { name: string, id: number }) => {
  // Try to get the stored filters from localStorage
  try {
    const storedFilters = localStorage.getItem('pokemon-form-filters');
    if (storedFilters) {
      const filters = JSON.parse(storedFilters);
      const name = pokemon.name.toLowerCase();

      // Check for mega evolutions
      if (name.includes("mega") && !filters.mega) {
        return false;
      }
      
      // Check for regional variants
      if ((name.includes("alolan") || name.includes("galarian") || name.includes("hisuian")) && !filters.regional) {
        return false;
      }
      
      // Check for gender differences
      if ((name.includes("female") || name.includes("male")) && !filters.gender) {
        return false;
      }
      
      // Check for special forms
      if ((name.includes("form") || name.includes("style") || name.includes("mode") || 
           name.includes("size") || name.includes("cloak")) && !filters.forms) {
        return false;
      }
    }
  } catch (e) {
    console.error("Error applying Pokemon form filters:", e);
  }
  
  // Default to including the Pokemon if there was an error or no filters
  return true;
};

// Keep the original function for backward compatibility and specific generations
export async function fetchAllPokemon(generationId: number = 1, fullRankingMode: boolean = false): Promise<Pokemon[]> {
  try {
    // For battle mode, when selecting "All Generations"
    if (generationId === 0) {
      if (!fullRankingMode) {
        // For quick battle mode, select random samples from different generations
        // This gives a diverse but manageable set
        const sampleSize = 500; // Increasing from 150 to 500 to allow for more Pokemon diversity
        
        toast({
          title: "Loading sample",
          description: `Loading a selection of ${sampleSize} Pokémon from all generations for battling.`
        });
        
        // Create an array representing all Pokemon IDs
        const allPokemonIds = Array.from({ length: generations[0].end }, (_, i) => i + 1);
        
        // Shuffle the array
        const shuffledIds = allPokemonIds.sort(() => Math.random() - 0.5);
        
        // Take the first 'sampleSize' Pokemon
        const selectedIds = shuffledIds.slice(0, sampleSize);
        
        // Fetch details for each selected Pokemon
        const pokemonList = await Promise.all(
          selectedIds.map(async (id) => {
            const pokemon = await fetchPokemonDetails(id);
            return pokemon;
          })
        );
        
        // Apply form filters
        return pokemonList.filter(shouldIncludePokemon);
      } else {
        // For full ranking mode, we need to fetch all Pokemon in batches
        toast({
          title: "Loading all Pokémon",
          description: "This may take a moment as we load all Pokémon for a complete ranking."
        });
        
        // Batch size for API requests
        const BATCH_SIZE = 100;
        const allPokemon: Pokemon[] = [];
        const totalPokemon = generations[0].end;
        
        // Fetch in batches to avoid overwhelming the API
        for (let offset = 0; offset < totalPokemon; offset += BATCH_SIZE) {
          const limit = Math.min(BATCH_SIZE, totalPokemon - offset);
          
          try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch batch at offset ${offset}`);
            }
            
            const data = await response.json();
            
            // Process each Pokemon in the batch
            const batchPromises = data.results.map(async (pokemon: { name: string; url: string }) => {
              const pokemonId = pokemon.url.split('/').filter(Boolean).pop();
              
              return {
                id: Number(pokemonId),
                name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
                // We don't fetch detailed data for all Pokemon to improve performance
                types: [],
                flavorText: ""
              };
            });
            
            const batchResults = await Promise.all(batchPromises);
            // Filter and add Pokemon based on form preferences
            allPokemon.push(...batchResults.filter(shouldIncludePokemon));
            
            // Update progress
            toast({
              title: "Loading progress",
              description: `Loaded ${Math.min(offset + BATCH_SIZE, totalPokemon)} of ${totalPokemon} Pokémon...`
            });
          } catch (error) {
            console.error(`Error fetching batch at offset ${offset}:`, error);
            toast({
              title: "Error",
              description: `Failed to fetch some Pokémon. Your ranking might be incomplete.`,
              variant: "destructive"
            });
          }
        }
        
        return allPokemon;
      }
    }
    
    const selectedGeneration = generations.find(gen => gen.id === generationId) || generations[1];
    const limit = selectedGeneration.end - selectedGeneration.start + 1;
    const offset = selectedGeneration.start - 1;
    
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Pokemon');
    }
    
    const data = await response.json();
    
    const pokemonList = await Promise.all(
      data.results.map(async (pokemon: { name: string; url: string }) => {
        const pokemonId = pokemon.url.split('/').filter(Boolean).pop();
        return fetchPokemonDetails(Number(pokemonId));
      })
    );
    
    // Apply form filters and return
    return pokemonList.filter(shouldIncludePokemon);
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    toast({
      title: "Error",
      description: "Failed to fetch Pokemon. Please try again.",
      variant: "destructive"
    });
    return [];
  }
}
