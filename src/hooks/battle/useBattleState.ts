
import { useBattleStateCore } from "./useBattleStateCore";

export * from "./types";

/**
 * Main hook for all battle state management - now using the refactored hooks
 */
export const useBattleState = () => {
  const { generateRankings } = useRankings(allPokemon);

};
