
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const createBattleGenerator = (
  allPokemonForGeneration: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  console.log(`⚡ [BATTLE_GENERATOR_FIX] Battle generator created with ${allPokemonForGeneration.length} Pokemon`);

  // CRITICAL FIX: Create truly random battle generation
  const generateTrulyRandomBattle = (battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    console.log(`🎲 [TRUE_RANDOM_FIX] Generating completely random battle of size ${battleSize}`);
    
    if (!allPokemonForGeneration || allPokemonForGeneration.length === 0) {
      console.error(`🎲 [TRUE_RANDOM_FIX] No Pokemon available`);
      return [];
    }
    
    // Use crypto.getRandomValues for better randomness
    const shuffled = [...allPokemonForGeneration];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const j = Math.floor((randomArray[0] / (0xFFFFFFFF + 1)) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const selected = shuffled.slice(0, battleSize);
    console.log(`🎲 [TRUE_RANDOM_FIX] Selected: ${selected.map(p => p.name).join(' vs ')}`);
    
    return selected;
  };

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    const battleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10) + 1;
    localStorage.setItem('pokemon-battle-count', String(battleCount));
    
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_TRACE] ===== startNewBattle CALLED =====`);
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_TRACE] Battle #${battleCount} for type: ${battleType}`);
    
    // CRITICAL FIX: Check refinement queue FIRST
    const refinementQueue = useSharedRefinementQueue();
    
    if (refinementQueue && refinementQueue.hasRefinementBattles && refinementQueue.refinementBattleCount > 0) {
      console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ Using refinement queue`);
      
      const nextRefinement = refinementQueue.getNextRefinementBattle();
      if (nextRefinement) {
        const primary = allPokemonForGeneration.find(p => p.id === nextRefinement.primaryPokemonId);
        const opponent = allPokemonForGeneration.find(p => p.id === nextRefinement.opponentPokemonId);
        
        if (primary && opponent) {
          const refinementBattle = [primary, opponent];
          console.log(`🎯 [REFINEMENT_QUEUE_PROCESSING] ✅ Using refinement: ${primary.name} vs ${opponent.name}`);
          
          const validatedBattle = validateBattlePokemon(refinementBattle);
          setCurrentBattle(validatedBattle);
          return validatedBattle;
        } else {
          console.error(`🎯 [REFINEMENT_QUEUE_PROCESSING] Pokemon not found - removing invalid battle`);
          refinementQueue.popRefinementBattle();
          // Try again
          return startNewBattle(battleType);
        }
      }
    }
    
    // CRITICAL FIX: Use truly random generation for regular battles
    console.log(`🎲 [TRUE_RANDOM_FIX] No refinement battles - using truly random generation`);
    const result = generateTrulyRandomBattle(battleType);
    
    if (result.length === 0) {
      console.error(`🎲 [TRUE_RANDOM_FIX] Failed to generate battle`);
      return [];
    }

    const validatedBattle = validateBattlePokemon(result);
    setCurrentBattle(validatedBattle);
    
    console.log(`✅ [TRUE_RANDOM_FIX] Battle generated and set: ${validatedBattle.map(p => p.name).join(' vs ')}`);
    
    return validatedBattle;
  };

  return { startNewBattle };
};
