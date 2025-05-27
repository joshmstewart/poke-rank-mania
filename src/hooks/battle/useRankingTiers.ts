
import { useState, useEffect, useCallback } from "react";
import { TopNOption } from "@/services/pokemon";

export const useRankingTiers = () => {
  const [frozenPokemon, setFrozenPokemon] = useState<Record<number, { [tier: string]: boolean }>>({});

  useEffect(() => {
    const storedFrozen = localStorage.getItem("pokemon-frozen-pokemon");
    if (storedFrozen) {
      try {
        setFrozenPokemon(JSON.parse(storedFrozen));
      } catch (e) {
        console.error("Error loading frozen pokemon state:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pokemon-frozen-pokemon", JSON.stringify(frozenPokemon));
  }, [frozenPokemon]);

  const freezePokemonForTier = useCallback((pokemonId: number, tier: TopNOption) => {
    setFrozenPokemon(prev => ({
      ...prev,
      [pokemonId]: {
        ...(prev[pokemonId] || {}),
        [tier.toString()]: true
      }
    }));
  }, []);

  const isPokemonFrozenForTier = useCallback((pokemonId: number, tier: TopNOption): boolean => {
    return Boolean(frozenPokemon[pokemonId]?.[tier.toString()]);
  }, [frozenPokemon]);

  const handleSaveRankings = useCallback(() => {
    localStorage.setItem("pokemon-frozen-pokemon", JSON.stringify(frozenPokemon));
  }, [frozenPokemon]);

  return {
    frozenPokemon,
    freezePokemonForTier,
    isPokemonFrozenForTier,
    handleSaveRankings
  };
};
