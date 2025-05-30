
import { useState, useEffect } from 'react';
import { TCGCard } from './tcg/types';
import { fetchTCGCards } from './tcg/api';

export const usePokemonTCGCard = (pokemonName: string, isModalOpen: boolean) => {
  const [tcgCard, setTcgCard] = useState<TCGCard | null>(null);
  const [secondTcgCard, setSecondTcgCard] = useState<TCGCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isModalOpen || !pokemonName) return;

    const fetchTCGCard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { firstCard, secondCard } = await fetchTCGCards(pokemonName);
        
        setTcgCard(firstCard);
        setSecondTcgCard(secondCard);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`🃏 [TCG_ERROR] Failed to fetch TCG card for ${pokemonName}:`, errorMessage);
        setError(errorMessage);
        setTcgCard(null);
        setSecondTcgCard(null);
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
