import { toast } from "@/hooks/use-toast";
import { Pokemon } from "../types";
import { generations } from "../data";
import { fetchPokemonDetails } from "./utils";

// Helper function to check if a Pokemon should be included based on current form filters
const shouldIncludePokemon = (pokemon: { name: string, id: number }) => {
  try {
    // CRITICAL FIX: Filter out "starter" Pokemon duplicates
    const name = pokemon.name.toLowerCase();
    if (name.includes('starter')) {
      console.log(`🚫 [STARTER_FILTER] Filtering out duplicate starter Pokemon: ${pokemon.name} (ID: ${pokemon.id})`);
      return false;
    }
    
    // CRITICAL FIX: Filter out ONLY the specific problematic Cramorant forms
    if ((name.includes('cramorant-gulping')) || (name.includes('cramorant-gorging'))) {
      console.log(`🚫 [CRAMORANT_FILTER] Filtering out problematic Cramorant form: ${pokemon.name} (ID: ${pokemon.id})`);
      return false;
    }
    
    const storedFilters = localStorage.getItem('pokemon-form-filters');
    if (storedFilters) {
      const filters = JSON.parse(storedFilters);
      
      if (filters.megaGmax && filters.regional && filters.gender && filters.forms && 
          filters.originPrimal && filters.costumes) {
        return true;
      }
      
      const name = pokemon.name.toLowerCase();

      if ((name.includes("pikachu") && (
          name.includes("cap") || name.includes("phd") || name.includes("cosplay") || 
          name.includes("belle") || name.includes("libre") || name.includes("pop-star") || 
          name.includes("rock-star"))) && !filters.costumes) {
        return false;
      }
      
      if ((name.includes("origin") || name.includes("primal")) && !filters.originPrimal) {
        return false;
      }
      
      if ((name.includes("mega") || name.includes("gmax")) && !filters.megaGmax) {
        return false;
      }
      
      if ((name.includes("alolan") || name.includes("galarian") || 
           name.includes("hisuian") || name.includes("paldean")) && !filters.regional) {
        return false;
      }
      
      if ((name.includes("female") || name.includes("male") || 
           name.includes("-f") || name.includes("-m")) && !filters.gender) {
        return false;
      }
      
      if ((name.includes("form") || name.includes("style") || name.includes("mode") || 
           name.includes("size") || name.includes("cloak") || name.includes("rotom-") ||
           name.includes("forme") || name.includes("unbound") || name.includes("eternamax") || name.includes("-theme")) && 
          !filters.forms) {
        return false;
      }
    }
  } catch (e) {
    console.error("Error applying Pokemon form filters:", e);
  }
  
  return true;
};

export async function fetchAllPokemon(
  generationId: number = 1, 
  fullRankingMode: boolean = false, 
  isInitialBatch: boolean = false, 
  batchSize: number = 150
): Promise<Pokemon[]> {
  try {
    console.log(`🔍 [LOADING_MILESTONE_DEBUG] fetchAllPokemon called with:`, {
      generationId,
      fullRankingMode,
      isInitialBatch,
      batchSize,
      timestamp: new Date().toISOString()
    });

    if (generationId === 0) {
      if (!fullRankingMode || isInitialBatch) {
        const sampleSize = isInitialBatch ? batchSize : 500;
        
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] Processing initial/sample batch - sampleSize: ${sampleSize}`);
        
        if (isInitialBatch) {
          toast({
            title: "Quick start",
            description: `Loading ${sampleSize} Pokémon to start battles immediately...`
          });
        } else {
          toast({
            title: "Loading sample",
            description: `Loading a selection of ${sampleSize} Pokémon from all generations for battling.`
          });
        }
        
        const regularPokemonIds = Array.from({ length: generations[0].end }, (_, i) => i + 1);
        
        // FURFROU DEBUG: Explicitly include known Furfrou form IDs
        const furfrouFormIds = [
          10126, 10127, 10128, 10129, 10130, 10131, 10132, 10133, 10134
        ];
        
        const specialFormIds = Array.from({ length: 250 }, (_, i) => i + 10001);
        const allPokemonIds = [...regularPokemonIds, ...specialFormIds, ...furfrouFormIds];
        
        console.log(`🐩 [FURFROU_DEBUG] Explicitly including Furfrou form IDs: ${furfrouFormIds.join(', ')}`);
        
        const shuffledIds = allPokemonIds.sort(() => Math.random() - 0.5);
        const selectedIds = shuffledIds.slice(0, sampleSize);
        
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] Selected ${selectedIds.length} Pokemon IDs for fetching`);
        
        // FURFROU DEBUG: Check if any Furfrou forms were selected
        const selectedFurfrouIds = selectedIds.filter(id => furfrouFormIds.includes(id));
        console.log(`🐩 [FURFROU_DEBUG] Selected Furfrou form IDs: ${selectedFurfrouIds.join(', ')}`);
        
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
        
        const validPokemon = pokemonList.filter(p => p !== null) as Pokemon[];
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] Successfully fetched ${validPokemon.length} valid Pokemon`);
        
        // FURFROU DEBUG: Check how many Furfrou forms were actually fetched
        const fetchedFurfrou = validPokemon.filter(p => p.name.toLowerCase().includes('furfrou'));
        console.log(`🐩 [FURFROU_DEBUG] Successfully fetched ${fetchedFurfrou.length} Furfrou forms:`);
        fetchedFurfrou.forEach(furfrou => {
          console.log(`🐩 [FURFROU_DEBUG] - Fetched: ${furfrou.name} (ID: ${furfrou.id})`);
        });
        
        const filteredList = validPokemon.filter(shouldIncludePokemon);
        
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] After filtering: ${filteredList.length} Pokemon remain`);
        
        // CRITICAL: Log specific Cramorant filtering results
        const originalCramorantCount = validPokemon.filter(p => p.name.toLowerCase().includes('cramorant')).length;
        const filteredCramorantCount = filteredList.filter(p => p.name.toLowerCase().includes('cramorant')).length;
        console.log(`🐦 [CRAMORANT_SPECIFIC_DEBUG] Original: ${originalCramorantCount}, Filtered: ${filteredCramorantCount}`);
        
        validPokemon.forEach(p => {
          if (p.name.toLowerCase().includes('cramorant')) {
            console.log(`🐦 [CRAMORANT_SPECIFIC_DEBUG] Found: ${p.name} (ID: ${p.id})`);
          }
        });
        
        filteredList.forEach(p => {
          if (p.name.toLowerCase().includes('cramorant')) {
            console.log(`🐦 [CRAMORANT_SPECIFIC_DEBUG] Kept after filtering: ${p.name} (ID: ${p.id})`);
          }
        });
        
        // FURFROU DEBUG: Check how many survived filtering
        const filteredFurfrou = filteredList.filter(p => p.name.toLowerCase().includes('furfrou'));
        console.log(`🐩 [FURFROU_DEBUG] After filtering: ${filteredFurfrou.length} Furfrou forms survived`);
        filteredFurfrou.forEach(furfrou => {
          console.log(`🐩 [FURFROU_DEBUG] - Survived filtering: ${furfrou.name} (ID: ${furfrou.id})`);
        });
        
        // CRITICAL FIX: Log starter and Cramorant filtering results
        const starterCount = validPokemon.filter(p => p.name.toLowerCase().includes('starter')).length;
        const filteredStarterCount = filteredList.filter(p => p.name.toLowerCase().includes('starter')).length;
        console.log(`🚫 [STARTER_FILTER] Filtered out ${starterCount - filteredStarterCount} starter Pokemon duplicates`);
        
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] FINAL RESULT: Returning ${filteredList.length} Pokemon`);
        
        return filteredList;
      } else {
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] Processing FULL RANKING MODE - loading ALL Pokemon`);
        
        // CRITICAL FIX: Always use fetchPokemonDetails to get complete type data
        toast({
          title: "Loading all Pokémon",
          description: "This may take a moment as we load all Pokémon for a complete ranking."
        });
        
        const BATCH_SIZE = 50; // Reduced batch size since we're now fetching full details
        const allPokemon: Pokemon[] = [];
        const totalPokemon = generations[0].end;
        
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] Starting full load - ${totalPokemon} total Pokemon expected`);
        
        for (let offset = 0; offset < totalPokemon; offset += BATCH_SIZE) {
          const limit = Math.min(BATCH_SIZE, totalPokemon - offset);
          
          try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch batch at offset ${offset}`);
            }
            
            const data = await response.json();
            
            // CRITICAL FIX: Fetch full Pokemon details instead of basic objects
            const batchPromises = data.results.map(async (pokemon: { name: string; url: string }) => {
              const pokemonId = pokemon.url.split('/').filter(Boolean).pop();
              try {
                return await fetchPokemonDetails(Number(pokemonId));
              } catch (error) {
                console.warn(`Failed to fetch details for Pokemon #${pokemonId}:`, error);
                return null;
              }
            });
            
            const batchResults = (await Promise.all(batchPromises)).filter(p => p !== null) as Pokemon[];
            allPokemon.push(...batchResults.filter(shouldIncludePokemon));
            
            console.log(`🎯 [LOADING_MILESTONE_DEBUG] Batch ${Math.floor(offset/BATCH_SIZE) + 1}: Loaded ${Math.min(offset + BATCH_SIZE, totalPokemon)} of ${totalPokemon} Pokemon - Current total: ${allPokemon.length}`);
            
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
        
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] Finished regular Pokemon - loaded ${allPokemon.length} so far`);
        
        try {
          const specialFormIds = Array.from({ length: 250 }, (_, i) => i + 10001);
          
          console.log(`🎯 [LOADING_MILESTONE_DEBUG] Starting special forms load - ${specialFormIds.length} forms to process`);
          
          const specialFormPromises = specialFormIds.map(async (id) => {
            try {
              return await fetchPokemonDetails(id);
            } catch (error) {
              console.warn(`Failed to fetch special form #${id}:`, error);
              return null;
            }
          });
          
          const specialForms = (await Promise.all(specialFormPromises)).filter(p => p !== null) as Pokemon[];
          console.log(`🎯 [LOADING_MILESTONE_DEBUG] Loaded ${specialForms.length} special form Pokémon`);
          
          const filteredSpecialForms = specialForms.filter(shouldIncludePokemon);
          allPokemon.push(...filteredSpecialForms);
          
          console.log(`🎯 [LOADING_MILESTONE_DEBUG] After adding special forms: ${allPokemon.length} total Pokemon`);
        } catch (error) {
          console.error("Error fetching special forms:", error);
        }
        
        console.log(`🎯 [LOADING_MILESTONE_DEBUG] FINAL FULL RANKING RESULT: Returning ${allPokemon.length} Pokemon`);
        
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
    
    const specialForms: Pokemon[] = [];
    
    if (generationId === 6) {
      const megaIds = Array.from({ length: 30 }, (_, i) => i + 10025);
      
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
    } else if (generationId === 7) {
      const alolanIds = Array.from({ length: 20 }, (_, i) => i + 10100);
      
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
    } else if (generationId === 8) {
      const galarianIds = Array.from({ length: 30 }, (_, i) => i + 10150);
      
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
    
    pokemonList.push(...specialForms);
    
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
