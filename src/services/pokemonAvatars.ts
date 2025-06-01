
interface TrainerApiResponse {
  sprites: {
    front_default: string;
  };
}

export const getPokemonAvatars = async (): Promise<string[]> => {
  const avatars: string[] = [];
  
  // Expanded list including baby starters, mythical Pokemon, and legendaries organized by generation
  const pokemonIds = [
    // Generation 1
    1, 4, 7, // Starters
    25, // Pikachu
    144, 145, 146, // Legendary birds
    150, 151, // Mewtwo, Mew
    
    // Generation 2
    152, 155, 158, // Starters
    172, // Pichu (baby)
    243, 244, 245, // Legendary beasts
    249, 250, // Lugia, Ho-Oh
    251, // Celebi (mythical)
    
    // Generation 3
    252, 255, 258, // Starters
    377, 378, 379, // Legendary golems
    380, 381, // Latios, Latias
    382, 383, 384, // Weather trio
    385, 386, // Jirachi, Deoxys (mythical)
    
    // Generation 4
    387, 390, 393, // Starters
    480, 481, 482, // Lake trio
    483, 484, 487, // Creation trio
    489, 490, 491, 492, // Phione, Manaphy, Darkrai, Shaymin (mythical)
    493, // Arceus (mythical)
    
    // Generation 5
    495, 498, 501, // Starters
    638, 639, 640, // Swords of Justice
    641, 642, 645, 646, // Forces of Nature + Kyurem
    643, 644, // Reshiram, Zekrom
    647, 648, 649, // Keldeo, Meloetta, Genesect (mythical)
    
    // Generation 6
    650, 653, 656, // Starters
    716, 717, 718, // Xerneas, Yveltal, Zygarde
    719, 720, 721, // Diancie, Hoopa, Volcanion (mythical)
    
    // Generation 7
    722, 725, 728, // Starters
    785, 786, 787, 788, // Tapu guardians
    789, 790, 791, 792, // Cosmog evolution line
    800, 801, 802, 807, 808, // Necrozma, Magearna, Marshadow, Zeraora (mythical)
    
    // Generation 8
    810, 813, 816, // Starters
    888, 889, 890, // Zacian, Zamazenta, Eternatus
    891, 892, 893, 894, 895, 896, 897, 898, // Mythical Pokemon
    
    // Generation 9
    906, 909, 912, // Starters
    1007, 1008, 1009, 1010, // Legendaries
    1001, 1025, // Gimmighoul, Pecharunt (mythical)
  ];
  
  try {
    const promises = pokemonIds.map(async (id) => {
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
