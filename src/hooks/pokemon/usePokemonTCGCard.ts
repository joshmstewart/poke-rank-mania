
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
          const firstCard = data.data[0];
          
          // Log metadata for decision-making
          console.log(`🃏 [TCG_METADATA] Card metadata for ${pokemonName}:`, {
            id: firstCard.id,
            name: firstCard.name,
            setName: firstCard.set.name,
            setSeries: firstCard.set.series,
            rarity: firstCard.rarity,
            supertype: firstCard.supertype,
            subtypes: firstCard.subtypes,
            hp: firstCard.hp,
            types: firstCard.types,
            hasLargeImage: !!firstCard.images?.large,
            imageUrl: firstCard.images?.large,
            flavorText: firstCard.flavorText,
            attacksCount: firstCard.attacks?.length || 0
          });

          setTcgCard(firstCard);
          tcgCardCache.set(cacheKey, firstCard);
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
