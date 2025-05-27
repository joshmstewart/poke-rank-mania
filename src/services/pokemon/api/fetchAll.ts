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
           name.includes("forme") || name.includes("unbound") || name.includes("gorging") ||
           name.includes("eternamax") || name.includes("-theme")) && 
          !filters.forms) {
        return false;
      }
    }
  } catch (e) {
    console.error("Error applying Pokemon form filters:", e);
  }
  
  return true;
};

export async function fetchAllPokemon(generationId: number = 1, fullRankingMode: boolean = false): Promise<Pokemon[]> {
  try {
    if (generationId === 0) {
      if (!fullRankingMode) {
        const sampleSize = 500;
        
        toast({
          title: "Loading sample",
          description: `Loading a selection of ${sampleSize} Pokémon from all generations for battling.`
        });
        
        const regularPokemonIds = Array.from({ length: generations[0].end }, (_, i) => i + 1);
        
        // FURFROU DEBUG: Explicitly include known Furfrou form IDs
        const furfrouFormIds = [
          10126, // Furfrou Heart Trim
          10127, // Furfrou Star Trim  
          10128, // Furfrou Diamond Trim
          10129, // Furfrou Debutante Trim
          10130, // Furfrou Matron Trim
          10131, // Furfrou Dandy Trim
          10132, // Furfrou La Reine Trim
          10133, // Furfrou Kabuki Trim
          10134, // Furfrou Pharaoh Trim
        ];
        
        const specialFormIds = Array.from({ length: 250 }, (_, i) => i + 10001);
        const allPokemonIds = [...regularPokemonIds, ...specialFormIds, ...furfrouFormIds];
        
        console.log(`🐩 [FURFROU_DEBUG] Explicitly including Furfrou form IDs: ${furfrouFormIds.join(', ')}`);
        
        const shuffledIds = allPokemonIds.sort(() => Math.random() - 0.5);
        const selectedIds = shuffledIds.slice(0, sampleSize);
        
        // FURFROU DEBUG: Check if any Furfrou forms were selected
        const selectedFurfrouIds = selectedIds.filter(id => furfrouFormIds.includes(id));
        console.log(`🐩 [FURFROU_DEBUG] Selected Furfrou form IDs: ${selectedFurfrouIds.join(', ')}`);
        
        console.log(`Selected ${selectedIds.length} Pokémon IDs including special forms`);
        
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
        console.log(`Successfully fetched ${validPokemon.length} Pokémon`);
        
        // FURFROU DEBUG: Check how many Furfrou forms were actually fetched
        const fetchedFurfrou = validPokemon.filter(p => p.name.toLowerCase().includes('furfrou'));
        console.log(`🐩 [FURFROU_DEBUG] Successfully fetched ${fetchedFurfrou.length} Furfrou forms:`);
        fetchedFurfrou.forEach(furfrou => {
          console.log(`🐩 [FURFROU_DEBUG] - Fetched: ${furfrou.name} (ID: ${furfrou.id})`);
        });
        
        const filteredList = validPokemon.filter(shouldIncludePokemon);
        
        // FURFROU DEBUG: Check how many survived filtering
        const filteredFurfrou = filteredList.filter(p => p.name.toLowerCase().includes('furfrou'));
        console.log(`🐩 [FURFROU_DEBUG] After filtering: ${filteredFurfrou.length} Furfrou forms survived`);
        filteredFurfrou.forEach(furfrou => {
          console.log(`🐩 [FURFROU_DEBUG] - Survived filtering: ${furfrou.name} (ID: ${furfrou.id})`);
        });
        
        // CRITICAL FIX: Log starter filtering results
        const starterCount = validPokemon.filter(p => p.name.toLowerCase().includes('starter')).length;
        const filteredStarterCount = filteredList.filter(p => p.name.toLowerCase().includes('starter')).length;
        console.log(`🚫 [STARTER_FILTER] Filtered out ${starterCount - filteredStarterCount} starter Pokemon duplicates`);
        
        console.log(`After filtering: ${filteredList.length} Pokémon`);
        
        return filteredList;
      } else {
        // REVERTED: Use basic objects for performance, types will be fetched when needed
        toast({
          title: "Loading all Pokémon",
          description: "This may take a moment as we load all Pokémon for a complete ranking."
        });
        
        const BATCH_SIZE = 100;
        const allPokemon: Pokemon[] = [];
        const totalPokemon = generations[0].end;
        
        for (let offset = 0; offset < totalPokemon; offset += BATCH_SIZE) {
          const limit = Math.min(BATCH_SIZE, totalPokemon - offset);
          
          try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch batch at offset ${offset}`);
            }
            
            const data = await response.json();
            
            // REVERTED: Use basic Pokemon objects for better performance
            const batchResults = data.results.map((pokemon: { name: string; url: string }) => {
              const pokemonId = pokemon.url.split('/').filter(Boolean).pop();
              return {
                id: Number(pokemonId),
                name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
                types: [], // Will be populated when needed for type colors
                flavorText: ""
              };
            });
            
            allPokemon.push(...batchResults.filter(shouldIncludePokemon));
            
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
        
        try {
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
