
interface TrainerApiResponse {
  sprites: {
    front_default: string;
  };
}

export const getPokemonAvatars = async (): Promise<string[]> => {
  const avatars: string[] = [];
  
  // Get trainer sprites from Pokemon TCG or use a curated list of trainer IDs
  // Since PokeAPI doesn't have a dedicated trainer endpoint, we'll use trainer card images
  // from specific Pokemon that represent trainers or use trainer-related Pokemon
  const trainerPokemonIds = [
    25, // Pikachu (Ash's signature)
    150, // Mewtwo
    151, // Mew
    250, // Ho-Oh
    249, // Lugia
    144, // Articuno
    145, // Zapdos
    146, // Moltres
    383, // Groudon
    384, // Rayquaza
    385, // Jirachi
    386, // Deoxys
    483, // Dialga
    484, // Palkia
    487, // Giratina
    493, // Arceus
    643, // Reshiram
    644, // Zekrom
    646, // Kyurem
    716, // Xerneas
    717, // Yveltal
    718, // Zygarde
    789, // Cosmog
    790, // Cosmoem
    791, // Solgaleo
  ];
  
  try {
    const promises = trainerPokemonIds.map(async (id) => {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (response.ok) {
        const pokemon: TrainerApiResponse = await response.json();
        return pokemon.sprites.front_default;
      }
      return null;
    });

    const results = await Promise.all(promises);
    
    // Filter out null results and return valid URLs
    return results.filter((url): url is string => url !== null);
  } catch (error) {
    console.error('Error fetching trainer avatars:', error);
    return [];
  }
};
