
interface PokemonApiResponse {
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

export const getPokemonAvatars = async (): Promise<string[]> => {
  const avatars: string[] = [];
  
  // Get first 24 Pokemon for avatar selection (popular ones)
  const pokemonIds = Array.from({ length: 24 }, (_, i) => i + 1);
  
  try {
    const promises = pokemonIds.map(async (id) => {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (response.ok) {
        const pokemon: PokemonApiResponse = await response.json();
        // Prefer official artwork, fallback to front sprite
        return pokemon.sprites.other['official-artwork'].front_default || 
               pokemon.sprites.front_default;
      }
      return null;
    });

    const results = await Promise.all(promises);
    
    // Filter out null results and return valid URLs
    return results.filter((url): url is string => url !== null);
  } catch (error) {
    console.error('Error fetching Pokemon avatars:', error);
    return [];
  }
};
