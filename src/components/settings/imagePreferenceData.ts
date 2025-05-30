
import { Image, CreditCard } from 'lucide-react';
import { ImageModeOption, ImageOption } from './types';

export const imageModeOptions: ImageModeOption[] = [
  {
    id: 'pokemon',
    name: 'Pokémon Images',
    description: 'Classic Pokémon artwork and sprites',
    icon: Image,
    previewImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'
  },
  {
    id: 'tcg',
    name: 'TCG Cards',
    description: 'Real Pokémon Trading Card Game cards',
    icon: CreditCard,
    previewImage: 'https://images.pokemontcg.io/base1/58_hires.png'
  }
];

export const imageTypeOptions: ImageOption[] = [
  {
    id: 'official',
    name: 'Official Artwork',
    description: 'High-quality official Pokémon artwork',
    previewUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'
  },
  {
    id: 'artwork',
    name: 'Dream World',
    description: 'Dream World style artwork',
    previewUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/25.svg'
  },
  {
    id: 'sprite',
    name: 'Classic Sprite',
    description: 'Retro pixel art sprites',
    previewUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
  }
];
