import { toast } from "@/hooks/use-toast";

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types?: string[];
  flavorText?: string;
}

export interface Generation {
  id: number;
  name: string;
  start: number;
  end: number;
}

// Pokémon generations data
export const generations: Generation[] = [
  { id: 0, name: "All Generations", start: 1, end: 1025 },
  { id: 1, name: "Generation I", start: 1, end: 151 },
  { id: 2, name: "Generation II", start: 152, end: 251 },
  { id: 3, name: "Generation III", start: 252, end: 386 },
  { id: 4, name: "Generation IV", start: 387, end: 493 },
  { id: 5, name: "Generation V", start: 494, end: 649 },
  { id: 6, name: "Generation VI", start: 650, end: 721 },
  { id: 7, name: "Generation VII", start: 722, end: 809 },
  { id: 8, name: "Generation VIII", start: 810, end: 905 },
  { id: 9, name: "Generation IX", start: 906, end: 1025 }
];

// For "All Generations", we'll implement pagination
export const ITEMS_PER_PAGE = 50;

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
    toast("Error", {
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

// Save rankings to both local storage and unified session storage
export function saveRankings(rankings: Pokemon[], generationId: number = 1): void {
  try {
    // Save to local storage for backward compatibility
    localStorage.setItem(`pokemon-rankings-gen-${generationId}`, JSON.stringify(rankings));
    
    // Save to unified session storage
    const sessionData = loadUnifiedSessionData();
    sessionData.rankings = sessionData.rankings || {};
    sessionData.rankings[`gen-${generationId}`] = rankings;
    
    // Add timestamp for last update
    sessionData.lastUpdate = Date.now();
    
    saveUnifiedSessionData(sessionData);
    
    // No toast notification for auto-saves to avoid spam
  } catch (error) {
    console.error('Error saving rankings:', error);
    toast("Error saving", {
      description: "Failed to save rankings. Please try again."
    });
  }
}

// Load rankings from unified session storage (with fallback to local storage)
export function loadRankings(generationId: number = 1): Pokemon[] {
  try {
    // Try to get from unified session storage first
    const sessionData = loadUnifiedSessionData();
    if (sessionData.rankings && sessionData.rankings[`gen-${generationId}`]) {
      return sessionData.rankings[`gen-${generationId}`];
    }
    
    // Fall back to legacy local storage
    const savedRankings = localStorage.getItem(`pokemon-rankings-gen-${generationId}`);
    if (savedRankings) {
      return JSON.parse(savedRankings);
    }
    
    return [];
  } catch (error) {
    console.error('Error loading rankings:', error);
    toast("Error", {
      description: "Failed to load saved rankings.",
      variant: "destructive"
    });
    return [];
  }
}

// Export rankings as JSON file
export function exportRankings(rankings: Pokemon[], generationId: number = 1): void {
  try {
    const dataStr = JSON.stringify(rankings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const genLabel = generationId === 0 ? "all" : `gen-${generationId}`;
    const exportFileDefaultName = `pokemon-rankings-${genLabel}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error('Error exporting rankings:', error);
    toast("Error", {
      description: "Failed to export rankings. Please try again.",
      variant: "destructive"
    });
  }
}

// Unified session data functions
interface UnifiedSessionData {
  sessionId?: string;
  rankings?: Record<string, Pokemon[]>;
  battleState?: any;
  lastUpdate?: number;
  lastManualSave?: number;
}

export function loadUnifiedSessionData(): UnifiedSessionData {
  try {
    const data = localStorage.getItem('pokemon-unified-session');
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading unified session data:', error);
    return {};
  }
}

export function saveUnifiedSessionData(data: UnifiedSessionData): void {
  try {
    localStorage.setItem('pokemon-unified-session', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving unified session data:', error);
  }
}

// Unified session import/export functions
export function exportUnifiedSessionData(): string {
  const sessionData = loadUnifiedSessionData();
  return JSON.stringify(sessionData, null, 2);
}

export function importUnifiedSessionData(data: string): boolean {
  try {
    const sessionData = JSON.parse(data);
    if (sessionData) {
      saveUnifiedSessionData(sessionData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing unified session data:', error);
    return false;
  }
}
