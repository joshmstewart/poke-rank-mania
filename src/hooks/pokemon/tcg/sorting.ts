
import { TCGCard } from './types';

// Rarity priority ranking (lower number = higher priority)
const rarityPriority: { [key: string]: number } = {
  'Amazing Rare': 1,
  'Rare Secret': 2,
  'Rare Ultra': 3,
  'Rare Rainbow': 4,
  'Rare Holo VMAX': 5,
  'Rare Holo V': 6,
  'Rare Holo GX': 7,
  'Rare Holo EX': 8,
  'Rare Holo': 9,
  'Rare': 10,
  'Uncommon': 11,
  'Common': 12
};

export const sortCardsByRarity = (cards: TCGCard[]): TCGCard[] => {
  return cards.sort((a, b) => {
    const aPriority = rarityPriority[a.rarity || ''] || 999;
    const bPriority = rarityPriority[b.rarity || ''] || 999;
    return aPriority - bPriority;
  });
};
