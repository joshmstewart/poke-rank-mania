
import { 
  getMiscategorizedExamples,
  logCategoryStats,
  getNormalPokemonStats
} from "./categorization";
import { storePokemon, getStoredPokemon, clearStoredPokemon } from "./excludedStore";

export const useFormFilterDebug = () => {
  // NEW: Function to get miscategorized examples for debugging
  const getMiscategorizedPokemonExamples = () => {
    return getMiscategorizedExamples();
  };

  // Function to log category stats
  const logStats = () => {
    logCategoryStats();
  };

  return {
    getMiscategorizedPokemonExamples,
    logStats,
    storePokemon,
    getStoredPokemon,
    clearStoredPokemon,
    getNormalPokemonStats // Export for debugging
  };
};
