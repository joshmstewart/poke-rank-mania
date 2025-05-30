
import { ImageType, ImageMode, PokemonImageType } from './types';

export const getPreferredImageUrl = (pokemonId: number): string => {
  const mode = localStorage.getItem('pokemon-image-mode') as ImageMode | null || 'pokemon';
  
  if (mode === 'tcg') {
    // For TCG mode, we'll return a placeholder since actual cards are loaded dynamically
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
  
  const preferredType = localStorage.getItem('pokemon-image-preference') as ImageType | null || 'official';
  
  switch (preferredType) {
    case 'official':
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
    case 'artwork':
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonId}.svg`;
    case 'sprite':
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
    default:
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
};

export const getCurrentImageMode = (): ImageMode => {
  return localStorage.getItem('pokemon-image-mode') as ImageMode | null || 'pokemon';
};

// Legacy function for backward compatibility
export const getPreferredImageType = (): PokemonImageType => {
  const preferredType = localStorage.getItem('pokemon-image-preference') as ImageType | null || 'official';
  
  // Map new types to legacy types
  switch (preferredType) {
    case 'official':
      return 'official';
    case 'artwork':
      return 'dream';
    case 'sprite':
      return 'default';
    default:
      return 'official';
  }
};
