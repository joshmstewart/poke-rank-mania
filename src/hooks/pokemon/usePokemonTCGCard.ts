
import { useState, useEffect } from 'react';

interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rarity?: string;
  set: {
    id: string;
    name: string;
    series: string;
  };
  images: {
    small: string;
    large: string;
  };
  flavorText?: string;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
}

interface TCGApiResponse {
  data: TCGCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

// In-memory cache for TCG cards
const tcgCardCache = new Map<string, TCGCard | null>();

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

const sortCardsByRarity = (cards: TCGCard[]): TCGCard[] => {
  return cards.sort((a, b) => {
    const aPriority = rarityPriority[a.rarity || ''] || 999;
    const bPriority = rarityPriority[b.rarity || ''] || 999;
    return aPriority - bPriority;
  });
};

export const usePokemonTCGCard = (pokemonName: string, isModalOpen: boolean) => {
  const [tcgCard, setTcgCard] = useState<TCGCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isModalOpen || !pokemonName) return;

    const fetchTCGCard = async () => {
      // Check cache first
      const cacheKey = pokemonName.toLowerCase();
      if (tcgCardCache.has(cacheKey)) {
        const cachedCard = tcgCardCache.get(cacheKey);
        console.log(`🃏 [TCG_CACHE] Found cached card for ${pokemonName}:`, cachedCard);
        setTcgCard(cachedCard);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
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
          
          console.log(`🃏 [TCG_RARITY] Available rarities for ${pokemonName}:`, 
            data.data.map(card => card.rarity).filter(Boolean)
          );
          console.log(`🃏 [TCG_SELECTION] Selected card with rarity: ${selectedCard.rarity}`);
          
          // Log metadata for decision-making
          console.log(`🃏 [TCG_METADATA] Card metadata for ${pokemonName}:`, {
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

          setTcgCard(selectedCard);
          tcgCardCache.set(cacheKey, selectedCard);
        } else {
          console.log(`🃏 [TCG_API] No TCG cards found for ${pokemonName}, using fallback`);
          setTcgCard(null);
          tcgCardCache.set(cacheKey, null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`🃏 [TCG_ERROR] Failed to fetch TCG card for ${pokemonName}:`, errorMessage);
        setError(errorMessage);
        setTcgCard(null);
        tcgCardCache.set(cacheKey, null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTCGCard();
  }, [pokemonName, isModalOpen]);

  return {
    tcgCard,
    isLoading,
    error,
    hasTcgCard: tcgCard !== null
  };
};
