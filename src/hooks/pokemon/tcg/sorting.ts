
import { TCGCard } from './types';

// Rarity priority ranking (lower number = higher priority)
const rarityPriority: { [key: string]: number } = {
  'Amazing Rare': 1,
  'Illustration Rare': 2,
  'Rare Secret': 3,
  'Rare Ultra': 4,
  'Rare Rainbow': 5,
  'Promo': 6,
  'Rare Holo VMAX': 7,
  'Rare Holo V': 8,
  'Rare Holo GX': 9,
  'Rare Holo EX': 10,
  'Rare Holo': 11,
  'Rare': 12,
  'Uncommon': 13,
  'Common': 14
};

export const sortCardsByRarity = (cards: TCGCard[]): TCGCard[] => {
  return cards.sort((a, b) => {
    const aPriority = rarityPriority[a.rarity || ''] || 999;
    const bPriority = rarityPriority[b.rarity || ''] || 999;
    return aPriority - bPriority;
  });
};

export const selectDiverseCards = (cards: TCGCard[]): { firstCard: TCGCard; secondCard: TCGCard | null } => {
  if (cards.length === 0) {
    throw new Error('No cards provided');
  }

  // Sort by rarity first
  const sortedCards = sortCardsByRarity(cards);
  const firstCard = sortedCards[0];

  if (sortedCards.length === 1) {
    return { firstCard, secondCard: null };
  }

  // Try to find a second card from a different set
  const secondCard = sortedCards.find(card => 
    card.set.id !== firstCard.set.id
  ) || sortedCards[1]; // Fallback to second card if all from same set

  return { firstCard, secondCard };
};
