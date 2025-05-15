
import { toast } from "@/hooks/use-toast";

export interface Pokemon {
  id: number;
  name: string;
  image: string;
}

export interface Generation {
  id: number;
  name: string;
  start: number;
  end: number;
}

// Pokémon generations data
export const generations: Generation[] = [
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

export async function fetchAllPokemon(generationId: number = 1): Promise<Pokemon[]> {
  try {
    const selectedGeneration = generations.find(gen => gen.id === generationId) || generations[0];
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
        return {
          id: Number(pokemonId),
          name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`
        };
      })
    );
    
    return pokemonList;
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

// Save rankings to local storage
export function saveRankings(rankings: Pokemon[], generationId: number = 1): void {
  try {
    localStorage.setItem(`pokemon-rankings-gen-${generationId}`, JSON.stringify(rankings));
    toast({
      title: "Success",
      description: "Your rankings have been saved!",
    });
  } catch (error) {
    console.error('Error saving rankings:', error);
    toast({
      title: "Error",
      description: "Failed to save rankings. Please try again.",
      variant: "destructive"
    });
  }
}

// Load rankings from local storage
export function loadRankings(generationId: number = 1): Pokemon[] {
  try {
    const savedRankings = localStorage.getItem(`pokemon-rankings-gen-${generationId}`);
    if (savedRankings) {
      return JSON.parse(savedRankings);
    }
    return [];
  } catch (error) {
    console.error('Error loading rankings:', error);
    toast({
      title: "Error",
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
    
    const exportFileDefaultName = `pokemon-rankings-gen-${generationId}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error('Error exporting rankings:', error);
    toast({
      title: "Error",
      description: "Failed to export rankings. Please try again.",
      variant: "destructive"
    });
  }
}

