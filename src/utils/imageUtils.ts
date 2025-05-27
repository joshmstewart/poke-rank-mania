
import { Pokemon } from "@/services/pokemon";

export type ImageType = 'official' | 'sprite';

export const getPreferredImage = (pokemon: Pokemon, preferredType: ImageType): string => {
  // Always return the main image for now - can be enhanced later if needed
  return pokemon.image || '';
};
