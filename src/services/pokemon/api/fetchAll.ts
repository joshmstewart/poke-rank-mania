
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
      
      // If all filters are enabled, include all Pokemon
      if (filters.mega && filters.regional && filters.gender && filters.forms) {
        return true;
      }
      
      const name = pokemon.name.toLowerCase();

      // Check for mega evolutions
      if (name.includes("mega") && !filters.mega) {
        return false;
      }
      
      // Check for regional variants - expanded to include paldean
      if ((name.includes("alolan") || name.includes("galarian") || 
           name.includes("hisuian") || name.includes("paldean")) && !filters.regional) {
        return false;
      }
      
      // Check for gender differences - expanded to include -f, -m notation
      if ((name.includes("female") || name.includes("male") || 
           name.includes("-f") || name.includes("-m")) && !filters.gender) {
        return false;
      }
      
      // Check for special forms - expanded to include more form types
      if ((name.includes("form") || name.includes("style") || name.includes("mode") || 
           name.includes("size") || name.includes("cloak") || name.includes("rotom-") ||
           name.includes("gmax") || name.includes("primal") || name.includes("forme") ||
           name.includes("origin") || name.includes("unbound") || name.includes("gorging") ||
           name.includes("eternamax") || name.includes("cap") || name.includes("-theme")) && 
          !filters.forms) {
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
        const sampleSize = 500; // Keep 500 Pokémon sample size
        
        toast({
          title: "Loading sample",
          description: `Loading a selection of ${sampleSize} Pokémon from all generations for battling.`
        });
        
        // Create an array representing all Pokemon IDs, including special forms (10000+)
        // IMPORTANT: We now include IDs beyond 898 up to ~10250 to include special forms
        const regularPokemonIds = Array.from({ length: generations[0].end }, (_, i) => i + 1);
        const specialFormIds = Array.from({ length: 250 }, (_, i) => i + 10001);
        const allPokemonIds = [...regularPokemonIds, ...specialFormIds];
        
        // Shuffle the array
        const shuffledIds = allPokemonIds.sort(() => Math.random() - 0.5);
        
        // Take the first 'sampleSize' Pokemon
        const selectedIds = shuffledIds.slice(0, sampleSize);
        
        console.log(`Selected ${selectedIds.length} Pokémon IDs including special forms`);
        
        // Fetch details for each selected Pokemon
        const pokemonList = await Promise.all(
          selectedIds.map(async (id) => {
            try {
              const pokemon = await fetchPokemonDetails(id);
              return pokemon;
            } catch (error) {
              console.warn(`Failed to fetch Pokémon #${id}:`, error);
              return null;
            }
          })
        );
        
        // Filter out failed fetches and apply form filters
        const validPokemon = pokemonList.filter(p => p !== null) as Pokemon[];
        console.log(`Successfully fetched ${validPokemon.length} Pokémon`);
        
        // Apply form filters - but only if they're disabled (include by default)
        const filteredList = validPokemon.filter(shouldIncludePokemon);
        console.log(`After filtering: ${filteredList.length} Pokémon`);
        
        return filteredList;
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
        
        // IMPORTANT: Now also fetch special forms (10000+)
        try {
          // Fetch a selection of special forms (Megas, regional forms, etc.)
          const specialFormIds = Array.from({ length: 250 }, (_, i) => i + 10001);
          
          const specialFormPromises = specialFormIds.map(async (id) => {
            try {
              return await fetchPokemonDetails(id);
            } catch (error) {
              console.warn(`Failed to fetch special form #${id}:`, error);
              return null;
            }
          });
          
          const specialForms = (await Promise.all(specialFormPromises)).filter(p => p !== null) as Pokemon[];
          console.log(`Loaded ${specialForms.length} special form Pokémon`);
          
          // Add special forms to the Pokemon list, filtering based on preferences
          allPokemon.push(...specialForms.filter(shouldIncludePokemon));
        } catch (error) {
          console.error("Error fetching special forms:", error);
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
    
    // IMPORTANT: Also fetch special forms for this generation (if any)
    const specialForms: Pokemon[] = [];
    
    if (generationId === 6) {  // X & Y (Mega evolutions)
      const megaIds = Array.from({ length: 30 }, (_, i) => i + 10025); // Approximate IDs for megas
      
      const megaPokemon = await Promise.all(
        megaIds.map(async (id) => {
          try {
            return await fetchPokemonDetails(id);
          } catch {
            return null;
          }
        })
      );
      
      specialForms.push(...megaPokemon.filter(p => p !== null) as Pokemon[]);
    } else if (generationId === 7) {  // Sun & Moon (Alolan forms)
      const alolanIds = Array.from({ length: 20 }, (_, i) => i + 10100); // Approximate IDs for Alolan forms
      
      const alolanPokemon = await Promise.all(
        alolanIds.map(async (id) => {
          try {
            return await fetchPokemonDetails(id);
          } catch {
            return null;
          }
        })
      );
      
      specialForms.push(...alolanPokemon.filter(p => p !== null) as Pokemon[]);
    } else if (generationId === 8) {  // Sword & Shield (Galarian forms, G-Max)
      const galarianIds = Array.from({ length: 30 }, (_, i) => i + 10150); // Approximate IDs for Galarian forms
      
      const galarianPokemon = await Promise.all(
        galarianIds.map(async (id) => {
          try {
            return await fetchPokemonDetails(id);
          } catch {
            return null;
          }
        })
      );
      
      specialForms.push(...galarianPokemon.filter(p => p !== null) as Pokemon[]);
    }
    
    // Add special forms to the Pokemon list
    pokemonList.push(...specialForms);
    
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
