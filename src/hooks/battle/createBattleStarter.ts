
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[] = []
) => {
  console.log(`🚀🚀🚀 [BATTLE_STARTER_CREATION] Creating battle starter with ${allPokemon.length} Pokemon`);
  
  let suggestionPriority = false;

  const startNewBattle = (battleType: BattleType, refinementQueue?: any) => {
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] ===== START NEW BATTLE =====`);
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] Battle type: ${battleType}`);
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] Refinement queue provided: ${!!refinementQueue}`);
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] Has refinement battles: ${refinementQueue?.hasRefinementBattles}`);
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] Refinement queue count: ${refinementQueue?.refinementBattleCount || 0}`);

    // PRIORITY 1: Check for refinement battles first
    if (refinementQueue?.hasRefinementBattles && refinementQueue.getNextRefinementBattle) {
      const nextBattle = refinementQueue.getNextRefinementBattle();
      console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] ✅ FOUND REFINEMENT BATTLE:`, nextBattle);
      
      if (nextBattle) {
        const pokemon1 = allPokemon.find(p => p.id === nextBattle.primaryPokemonId);
        const pokemon2 = allPokemon.find(p => p.id === nextBattle.opponentPokemonId);
        
        if (pokemon1 && pokemon2) {
          console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] ✅ REFINEMENT BATTLE CREATED: ${pokemon1.name} vs ${pokemon2.name}`);
          
          // Pop the battle from queue since we're using it
          refinementQueue.popRefinementBattle();
          
          return [pokemon1, pokemon2];
        } else {
          console.error(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] ❌ Could not find Pokemon for refinement battle:`, {
            primaryId: nextBattle.primaryPokemonId,
            opponentId: nextBattle.opponentPokemonId,
            found1: !!pokemon1,
            found2: !!pokemon2
          });
        }
      }
    }

    // PRIORITY 2: Regular battle generation
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] 🔄 No refinement battles, generating regular battle`);
    
    if (allPokemon.length < 2) {
      console.error(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] ❌ Not enough Pokemon for battle`);
      return [];
    }

    // Simple random battle for now
    const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
    const battle = shuffled.slice(0, 2);
    
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] ✅ REGULAR BATTLE CREATED: ${battle.map(p => p.name).join(' vs ')}`);
    return battle;
  };

  const resetSuggestionPriority = () => {
    suggestionPriority = false;
    console.log(`🚀🚀🚀 [BATTLE_STARTER_EXECUTION] Reset suggestion priority`);
  };

  return {
    startNewBattle,
    resetSuggestionPriority
  };
};
