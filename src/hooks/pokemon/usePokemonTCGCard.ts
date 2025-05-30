
import { useState, useEffect } from 'react';
import { TCGCard } from './tcg/types';
import { getCachedCard, setCachedCard } from './tcg/cache';
import { fetchTCGCards } from './tcg/api';

export const usePokemonTCGCard = (pokemonName: string, isModalOpen: boolean) => {
  const [tcgCard, setTcgCard] = useState<TCGCard | null>(null);
  const [secondTcgCard, setSecondTcgCard] = useState<TCGCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isModalOpen || !pokemonName) return;

    const fetchTCGCard = async () => {
      // Check persistent cache first
      const cachedCard = getCachedCard(pokemonName);
      if (cachedCard !== null) {
        setTcgCard(cachedCard);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { firstCard, secondCard } = await fetchTCGCards(pokemonName);
        
        setTcgCard(firstCard);
        setSecondTcgCard(secondCard);
        setCachedCard(pokemonName, firstCard);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`🃏 [TCG_ERROR] Failed to fetch TCG card for ${pokemonName}:`, errorMessage);
        setError(errorMessage);
        setTcgCard(null);
        setSecondTcgCard(null);
        setCachedCard(pokemonName, null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTCGCard();
  }, [pokemonName, isModalOpen]);

  return {
    tcgCard,
    secondTcgCard,
    isLoading,
    error,
    hasTcgCard: tcgCard !== null
  };
};
