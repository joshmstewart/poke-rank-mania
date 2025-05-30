
import { TCGApiResponse, TCGCard } from './types';
import { sortCardsByRarity } from './sorting';

export const fetchTCGCards = async (pokemonName: string): Promise<{ firstCard: TCGCard | null; secondCard: TCGCard | null }> => {
  // Clean the Pokemon name for API search (remove hyphens, special characters)
  const searchName = pokemonName
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  console.log(`🃏 [TCG_API] Searching for TCG cards with name: "${searchName}"`);
  
  const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${searchName}"`);
  
  if (!response.ok) {
    throw new Error(`TCG API error: ${response.status} ${response.statusText}`);
  }

  const data: TCGApiResponse = await response.json();
  console.log(`🃏 [TCG_API] Raw API response for ${pokemonName}:`, data);

  if (data.data && data.data.length > 0) {
    // Sort cards by rarity priority
    const sortedCards = sortCardsByRarity(data.data);
    const selectedCard = sortedCards[0];
    
    // Select second card if available (different from first)
    const secondCard = sortedCards.length > 1 ? sortedCards[1] : null;
    
    console.log(`🃏 [TCG_RARITY] Available rarities for ${pokemonName}:`, 
      data.data.map(card => card.rarity).filter(Boolean)
    );
    console.log(`🃏 [TCG_SELECTION] Selected first card with rarity: ${selectedCard.rarity}`);
    console.log(`🃏 [TCG_SELECTION] Selected second card with rarity: ${secondCard?.rarity || 'none'}`);
    
    // Log metadata for decision-making
    console.log(`🃏 [TCG_METADATA] First card metadata for ${pokemonName}:`, {
      id: selectedCard.id,
      name: selectedCard.name,
      setName: selectedCard.set.name,
      setSeries: selectedCard.set.series,
      rarity: selectedCard.rarity,
      supertype: selectedCard.supertype,
      subtypes: selectedCard.subtypes,
      hp: selectedCard.hp,
      types: selectedCard.types,
      hasLargeImage: !!selectedCard.images?.large,
      imageUrl: selectedCard.images?.large,
      flavorText: selectedCard.flavorText,
      attacksCount: selectedCard.attacks?.length || 0
    });

    return { firstCard: selectedCard, secondCard };
  }

  console.log(`🃏 [TCG_API] No TCG cards found for ${pokemonName}, using fallback`);
  return { firstCard: null, secondCard: null };
};
