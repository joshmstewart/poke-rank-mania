
import { fetchPokemonData } from './pokemonApi';
import { processPokemonData } from './pokemonProcessor';
import { generations } from '../data';

export const fetchAllPokemon = async (genId = 0, fullRankingMode = true, useFilters = true) => {
  console.log(`🔥 [FETCH_ALL] Starting fetch for generation ${genId}, fullRankingMode: ${fullRankingMode}`);
  
  try {
    // Determine Pokemon range based on generation
    let pokemonRange: [number, number];
    
    if (genId === 0) {
      pokemonRange = [1, 1025]; // All generations
    } else {
      const generation = generations.find(gen => gen.id === genId);
      if (!generation) {
        throw new Error(`Invalid generation ID: ${genId}`);
      }
      pokemonRange = [generation.start, generation.end];
    }
    
    console.log(`🔥 [FETCH_ALL] Fetching Pokemon range: ${pokemonRange[0]} - ${pokemonRange[1]}`);
    
    // Fetch basic Pokemon data for the range - using the correct function signature
    const rawPokemonList = await fetchPokemonData([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    console.log(`🔥 [FETCH_ALL] Fetched ${rawPokemonList.length} raw Pokemon`);
    
    // Convert Pokemon[] to RawPokemon[] format for the processor
    const rawPokemonForProcessor = rawPokemonList.map(pokemon => ({
      id: pokemon.id,
      name: pokemon.name,
      types: pokemon.types?.map(type => ({ type: { name: type.toLowerCase() } })) || [],
      sprites: {
        other: {
          'official-artwork': {
            front_default: pokemon.image
          }
        }
      }
    }));
    
    // Process the data with proper name handling
    const { allPokemon } = processPokemonData(rawPokemonForProcessor);
    
    console.log(`🔥 [FETCH_ALL] Successfully processed ${allPokemon.length} Pokemon with raw names`);
    return allPokemon;
    
  } catch (error) {
    console.error(`🔥 [FETCH_ALL] Error fetching Pokemon:`, error);
    throw error;
  }
};
