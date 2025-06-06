
import { useState, useCallback, useMemo } from 'react';
import { Pokemon, RankedPokemon } from '@/services/pokemon';

interface PriorityBattle {
  pokemon: Pokemon;
  targetOpponents: Pokemon[];
  battlesRemaining: number;
  originalBattleCount: number;
}

export const usePriorityQueue = () => {
  const [selectedPriorityPokemon, setSelectedPriorityPokemon] = useState<Set<number>>(new Set());
  const [priorityBattleQueue, setPriorityBattleQueue] = useState<PriorityBattle[]>([]);

  const togglePriorityPokemon = useCallback((pokemonId: number) => {
    setSelectedPriorityPokemon(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pokemonId)) {
        newSet.delete(pokemonId);
        console.log(`🌟 [PRIORITY_QUEUE] Removed Pokemon ${pokemonId} from priority selection`);
      } else {
        newSet.add(pokemonId);
        console.log(`🌟 [PRIORITY_QUEUE] Added Pokemon ${pokemonId} to priority selection`);
      }
      return newSet;
    });
  }, []);

  const isPrioritySelected = useCallback((pokemonId: number) => {
    return selectedPriorityPokemon.has(pokemonId);
  }, [selectedPriorityPokemon]);

  const generatePriorityBattles = useCallback((
    selectedPokemon: Pokemon[],
    topRankedPokemon: RankedPokemon[]
  ) => {
    console.log(`🌟 [PRIORITY_QUEUE] Generating priority battles for ${selectedPokemon.length} Pokemon`);
    
    // Get top 50 Pokemon for battles
    const top50 = topRankedPokemon.slice(0, 50);
    
    if (top50.length < 3) {
      console.warn(`🌟 [PRIORITY_QUEUE] Not enough top-ranked Pokemon (${top50.length}) to generate battles`);
      return [];
    }

    const newBattles: PriorityBattle[] = [];

    selectedPokemon.forEach(pokemon => {
      // Get 3 random opponents from top 50, excluding the selected Pokemon itself
      const availableOpponents = top50.filter(opponent => opponent.id !== pokemon.id);
      const shuffledOpponents = [...availableOpponents].sort(() => Math.random() - 0.5);
      const selectedOpponents = shuffledOpponents.slice(0, 3);

      if (selectedOpponents.length > 0) {
        newBattles.push({
          pokemon,
          targetOpponents: selectedOpponents,
          battlesRemaining: selectedOpponents.length,
          originalBattleCount: selectedOpponents.length
        });
        
        console.log(`🌟 [PRIORITY_QUEUE] Queued ${selectedOpponents.length} battles for ${pokemon.name} vs [${selectedOpponents.map(o => o.name).join(', ')}]`);
      }
    });

    // Randomize the order of all individual battles
    const allIndividualBattles: { pokemon: Pokemon; opponent: Pokemon; battleId: string }[] = [];
    
    newBattles.forEach(battle => {
      battle.targetOpponents.forEach(opponent => {
        allIndividualBattles.push({
          pokemon: battle.pokemon,
          opponent,
          battleId: `${battle.pokemon.id}-vs-${opponent.id}-${Date.now()}`
        });
      });
    });

    // Shuffle all battles to avoid repetition
    const shuffledBattles = allIndividualBattles.sort(() => Math.random() - 0.5);
    
    console.log(`🌟 [PRIORITY_QUEUE] Generated ${shuffledBattles.length} total priority battles in randomized order`);
    
    setPriorityBattleQueue(newBattles);
    return shuffledBattles;
  }, []);

  const getNextPriorityBattle = useCallback(() => {
    for (const battle of priorityBattleQueue) {
      if (battle.battlesRemaining > 0) {
        const nextOpponent = battle.targetOpponents[battle.originalBattleCount - battle.battlesRemaining];
        console.log(`🌟 [PRIORITY_QUEUE] Next priority battle: ${battle.pokemon.name} vs ${nextOpponent.name}`);
        return [battle.pokemon, nextOpponent];
      }
    }
    return null;
  }, [priorityBattleQueue]);

  const completePriorityBattle = useCallback((pokemonId: number, opponentId: number) => {
    setPriorityBattleQueue(prev => {
      const updated = prev.map(battle => {
        if (battle.pokemon.id === pokemonId) {
          const newBattlesRemaining = battle.battlesRemaining - 1;
          console.log(`🌟 [PRIORITY_QUEUE] Completed battle for ${battle.pokemon.name}, ${newBattlesRemaining} battles remaining`);
          
          if (newBattlesRemaining === 0) {
            // Remove from priority selection when all battles are complete
            setSelectedPriorityPokemon(current => {
              const newSet = new Set(current);
              newSet.delete(pokemonId);
              console.log(`🌟 [PRIORITY_QUEUE] ✅ All priority battles completed for ${battle.pokemon.name}, removing star`);
              return newSet;
            });
          }
          
          return {
            ...battle,
            battlesRemaining: newBattlesRemaining
          };
        }
        return battle;
      });
      
      // Filter out completed battles
      return updated.filter(battle => battle.battlesRemaining > 0);
    });
  }, []);

  const clearPrioritySelection = useCallback(() => {
    setSelectedPriorityPokemon(new Set());
    setPriorityBattleQueue([]);
    console.log(`🌟 [PRIORITY_QUEUE] Cleared all priority selections`);
  }, []);

  const hasPriorityBattles = useMemo(() => {
    return priorityBattleQueue.some(battle => battle.battlesRemaining > 0);
  }, [priorityBattleQueue]);

  const totalPriorityBattlesRemaining = useMemo(() => {
    return priorityBattleQueue.reduce((total, battle) => total + battle.battlesRemaining, 0);
  }, [priorityBattleQueue]);

  return {
    selectedPriorityPokemon,
    togglePriorityPokemon,
    isPrioritySelected,
    generatePriorityBattles,
    getNextPriorityBattle,
    completePriorityBattle,
    clearPrioritySelection,
    hasPriorityBattles,
    totalPriorityBattlesRemaining,
    priorityBattleQueue
  };
};
