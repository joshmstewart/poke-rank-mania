import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const createBattleStarter = (
  allPokemon: Pokemon[],
  filteredPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>
) => {
  const recentlyUsedPokemon = new Set<number>();
  const lastBattlePokemon = new Set<number>();
  let totalBattlesStarted = 0;

  const STORAGE_KEY = 'pokemon-active-suggestions';

  const shuffleArray = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const startNewBattle = (battleType: BattleType): Pokemon[] => {
    totalBattlesStarted++;
    console.log(`\n🔄 Starting new battle #${totalBattlesStarted} (type: ${battleType})`);

    const battleSize = battleType === "triplets" ? 3 : 2;

    // Step 1: Try suggestion-based battle from localStorage
    try {
      const rawSuggestions = localStorage.getItem(STORAGE_KEY);
      if (rawSuggestions) {
        const parsed = JSON.parse(rawSuggestions);
        const suggestedIds = Object.keys(parsed)
          .map(id => Number(id))
          .filter(id => !parsed[id].used);

        if (suggestedIds.length > 0) {
          const suggestionPool = filteredPokemon.filter(p => suggestedIds.includes(p.id));
          if (suggestionPool.length > 0) {
            const selected = suggestionPool[Math.floor(Math.random() * suggestionPool.length)];
            const suggestion = parsed[selected.id];

            console.log(`🧭 Using suggestion: ${selected.name} (${suggestion.direction} x${suggestion.strength})`);

            const offset = suggestion.strength * 5;
            const rankedIndex = currentRankings.findIndex(p => p.id === selected.id);

            let opponents: Pokemon[];
            if (suggestion.direction === "up") {
              opponents = currentRankings.slice(Math.max(0, rankedIndex - offset), rankedIndex);
            } else {
              opponents = currentRankings.slice(rankedIndex + 1, rankedIndex + 1 + offset);
            }

            const battle = [selected, ...shuffleArray(opponents.filter(p => p.id !== selected.id)).slice(0, battleSize - 1)];
            const shuffledBattle = shuffleArray(battle);

            lastBattlePokemon.clear();
            shuffledBattle.forEach(p => {
              lastBattlePokemon.add(p.id);
              recentlyUsedPokemon.add(p.id);
              if (recentlyUsedPokemon.size > Math.min(20, filteredPokemon.length / 2)) {
                recentlyUsedPokemon.delete(Array.from(recentlyUsedPokemon)[0]);
              }
            });

            console.log(`✅ Created suggestion-based battle: ${shuffledBattle.map(p => p.name).join(', ')}`);
            setCurrentBattle(shuffledBattle);
            return shuffledBattle;
          }
        }
      }
    } catch (e) {
      console.error("❌ Error reading suggestion from localStorage:", e);
    }

    // Step 2: Fallback — standard random battle logic with avoidance
    let candidates = filteredPokemon.filter(p =>
      !recentlyUsedPokemon.has(p.id) && !lastBattlePokemon.has(p.id)
    );

    if (candidates.length < battleSize * 2) {
      console.log("⚠️ Not enough unused Pokémon, relaxing filter to just exclude last battle");
      candidates = filteredPokemon.filter(p => !lastBattlePokemon.has(p.id));
    }

    if (candidates.length < battleSize) {
      console.warn("⚠️ Not enough candidates even after relaxing filter. Using full list.");
      candidates = filteredPokemon;
      recentlyUsedPokemon.clear();
    }

    const shuffled = shuffleArray(candidates);
    const selected = shuffled.slice(0, battleSize);

    lastBattlePokemon.clear();
    selected.forEach(p => {
      lastBattlePokemon.add(p.id);
      recentlyUsedPokemon.add(p.id);
      if (recentlyUsedPokemon.size > Math.min(20, filteredPokemon.length / 2)) {
        recentlyUsedPokemon.delete(Array.from(recentlyUsedPokemon)[0]);
      }
    });

    console.log(`🆕 Created fallback random battle: ${selected.map(p => p.name).join(', ')}`);
    setCurrentBattle(selected);
    return selected;
  };

  const trackLowerTierLoss = (loserId: number) => {
    console.log(`📉 Pokémon ${loserId} lost a battle`);
  };

  return {
    startNewBattle,
    trackLowerTierLoss
  };
};
