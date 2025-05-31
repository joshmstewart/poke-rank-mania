
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { useSharedRefinementQueue } from "./useSharedRefinementQueue";

export const createBattleGenerator = (
  allPokemonForGeneration: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  console.log(`⚡ [BATTLE_GENERATOR_FIX] Battle generator created with ${allPokemonForGeneration.length} Pokemon`);

  // CRITICAL DEBUG: Analyze the Pokemon data being passed to battle generation
  if (allPokemonForGeneration.length > 0) {
    const generationIds = allPokemonForGeneration.map(p => p.id);
    const genMinId = Math.min(...generationIds);
    const genMaxId = Math.max(...generationIds);
    console.log(`⚡ [BATTLE_GENERATOR_DATA_ANALYSIS] Pokemon ID range: ${genMinId} - ${genMaxId}`);
    
    const genDistribution = {
      '1-100': generationIds.filter(id => id >= 1 && id <= 100).length,
      '101-200': generationIds.filter(id => id >= 101 && id <= 200).length,
      '201-400': generationIds.filter(id => id >= 201 && id <= 400).length,
      '401-600': generationIds.filter(id => id >= 401 && id <= 600).length,
      '601-800': generationIds.filter(id => id >= 601 && id <= 800).length,
      '801-1025': generationIds.filter(id => id >= 801 && id <= 1025).length,
      '1026+': generationIds.filter(id => id >= 1026).length,
    };
    console.log(`⚡ [BATTLE_GENERATOR_DATA_ANALYSIS] Distribution at battle generator:`, genDistribution);
    
    // Sample some Pokemon names to check formatting
    const sampleLow = allPokemonForGeneration.filter(p => p.id <= 100).slice(0, 3);
    const sampleMid = allPokemonForGeneration.filter(p => p.id >= 400 && p.id <= 600).slice(0, 3);
    const sampleHigh = allPokemonForGeneration.filter(p => p.id >= 800).slice(0, 3);
    
    console.log(`⚡ [BATTLE_GENERATOR_DATA_ANALYSIS] Sample low ID Pokemon:`, sampleLow.map(p => `${p.name}(${p.id})`));
    console.log(`⚡ [BATTLE_GENERATOR_DATA_ANALYSIS] Sample mid ID Pokemon:`, sampleMid.map(p => `${p.name}(${p.id})`));
    console.log(`⚡ [BATTLE_GENERATOR_DATA_ANALYSIS] Sample high ID Pokemon:`, sampleHigh.map(p => `${p.name}(${p.id})`));
  }

  // CRITICAL FIX: Create truly random battle generation
  const generateTrulyRandomBattle = (battleType: BattleType): Pokemon[] => {
    const battleSize = battleType === "pairs" ? 2 : 3;
    
    console.log(`🎲 [TRUE_RANDOM_FIX] Generating completely random battle of size ${battleSize}`);
    console.log(`🎲 [TRUE_RANDOM_FIX] Available Pokemon count: ${allPokemonForGeneration.length}`);
    
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
    console.log(`🎲 [TRUE_RANDOM_FIX] Selected Pokemon: ${selected.map(p => `${p.name}(${p.id})`).join(', ')}`);
    
    // CRITICAL DEBUG: Log selection statistics
    const selectedIds = selected.map(p => p.id);
    const selectionStats = {
      ids: selectedIds,
      min: Math.min(...selectedIds),
      max: Math.max(...selectedIds),
      average: Math.round(selectedIds.reduce((sum, id) => sum + id, 0) / selectedIds.length)
    };
    console.log(`🎲 [TRUE_RANDOM_FIX] Selection statistics:`, selectionStats);
    
    return selected;
  };

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    const battleCount = parseInt(localStorage.getItem('pokemon-battle-count') || '0', 10) + 1;
    localStorage.setItem('pokemon-battle-count', String(battleCount));
    
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_TRACE] ===== startNewBattle CALLED =====`);
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_TRACE] Battle #${battleCount} for type: ${battleType}`);
    console.log(`🚨🚨🚨 [BATTLE_GENERATION_TRACE] Pokemon available for generation: ${allPokemonForGeneration.length}`);
    
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
    
    console.log(`✅ [TRUE_RANDOM_FIX] Battle generated and set: ${validatedBattle.map(p => `${p.name}(${p.id})`).join(' vs ')}`);
    
    return validatedBattle;
  };

  return { startNewBattle };
};
