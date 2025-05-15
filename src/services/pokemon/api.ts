
import { toast } from "@/hooks/use-toast";
import { Pokemon, ITEMS_PER_PAGE } from "./types";
import { generations } from "./data";

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

// Keep the original function for backward compatibility and specific generations
export async function fetchAllPokemon(generationId: number = 1, fullRankingMode: boolean = false): Promise<Pokemon[]> {
  try {
    // For battle mode, when selecting "All Generations"
    if (generationId === 0) {
      if (!fullRankingMode) {
        // For quick battle mode, select random samples from different generations
        // This gives a diverse but manageable set
        const sampleSize = 150; // A reasonable number for battles
        
        toast("Loading sample", {
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
            // Get detailed Pokemon data
            const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            let name = `Pokemon #${id}`;
            let types: string[] = [];
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              name = detailData.name.charAt(0).toUpperCase() + detailData.name.slice(1);
              types = detailData.types.map((type: any) => type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1));
            }
            
            // Get species data for flavor text
            const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
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
              id: Number(id),
              name: name,
              image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
              types,
              flavorText
            };
          })
        );
        
        return pokemonList;
      } else {
        // For full ranking mode, we need to fetch all Pokemon in batches
        toast("Loading all Pokémon", {
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
            allPokemon.push(...batchResults);
            
            // Update progress
            toast("Loading progress", {
              description: `Loaded ${Math.min(offset + BATCH_SIZE, totalPokemon)} of ${totalPokemon} Pokémon...`
            });
          } catch (error) {
            console.error(`Error fetching batch at offset ${offset}:`, error);
            toast("Error", {
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
    
    return pokemonList;
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    toast("Error", {
      description: "Failed to fetch Pokemon. Please try again.",
      variant: "destructive"
    });
    return [];
  }
}
