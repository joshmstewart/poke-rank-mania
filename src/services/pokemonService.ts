
import { toast } from "@/hooks/use-toast";

export interface Pokemon {
  id: number;
  name: string;
  image: string;
}

export async function fetchAllPokemon(limit: number = 151): Promise<Pokemon[]> {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);
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
export function saveRankings(rankings: Pokemon[]): void {
  try {
    localStorage.setItem('pokemon-rankings', JSON.stringify(rankings));
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
export function loadRankings(): Pokemon[] {
  try {
    const savedRankings = localStorage.getItem('pokemon-rankings');
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
export function exportRankings(rankings: Pokemon[]): void {
  try {
    const dataStr = JSON.stringify(rankings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'pokemon-rankings.json';
    
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
