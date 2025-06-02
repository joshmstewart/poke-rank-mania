
import { 
  getMiscategorizedExamples,
  logCategoryStats,
  getNormalPokemonStats
} from "./categorization";
import { storePokemon, getStoredPokemon, clearStoredPokemon } from "./excludedStore";

export const useFormFilterDebug = () => {
  const getMiscategorizedPokemonExamples = () => {
    return getMiscategorizedExamples();
  };

  const logStats = () => {
    logCategoryStats();
  };

  return {
    getMiscategorizedPokemonExamples,
    logStats,
    storePokemon,
    getStoredPokemon,
    clearStoredPokemon,
    getNormalPokemonStats
  };
};
