
import { useState, useEffect } from "react";
import { Pokemon, fetchAllPokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleType } from "./types";
import { useTrueSkillStore } from "@/stores/trueskillStore";

export const useBattleInitializer = (
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<any[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Pokemon[]>([]);
  const [battleType, setBattleType] = useState<BattleType>("pairs");
  
  const { totalBattles, isHydrated, waitForHydration, smartSync } = useTrueSkillStore();

  useEffect(() => {
    // Load battle type from localStorage (this is just UI preference, not data)
    const savedBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
    if (savedBattleType && (savedBattleType === "pairs" || savedBattleType === "triplets")) {
      setBattleType(savedBattleType);
    } else {
      localStorage.setItem('pokemon-ranker-battle-type', "pairs");
    }
  }, []);

  // ENHANCED SMART SYNC: Use new smart sync logic that preserves local data
  useEffect(() => {
    const performSmartCloudSync = async () => {
      try {
        console.log(`🌥️ [SMART_SYNC_INIT] Starting smart cloud synchronization...`);
        
        if (!isHydrated) {
          console.log(`🌥️ [SMART_SYNC_INIT] Waiting for TrueSkill hydration...`);
          await waitForHydration();
        }
        
        console.log(`🌥️ [SMART_SYNC_INIT] Hydration complete, performing smart sync...`);
        
        // Use smart sync instead of loadFromCloud to preserve local data
        await smartSync();
        
        // Get the final battle count after smart sync
        const finalTotalBattles = useTrueSkillStore.getState().totalBattles;
        console.log(`🌥️ [SMART_SYNC_INIT] ✅ Final battle count after smart sync: ${finalTotalBattles}`);
        
        setBattlesCompleted(finalTotalBattles);
        
      } catch (error) {
        console.error(`🌥️ [SMART_SYNC_INIT] ❌ Smart sync failed:`, error);
        
        // Fallback to current hydrated state
        const fallbackCount = totalBattles;
        console.log(`🌥️ [SMART_SYNC_INIT] 🔄 Using fallback count: ${fallbackCount}`);
        setBattlesCompleted(fallbackCount);
      }
    };

    performSmartCloudSync();
  }, [isHydrated, totalBattles, setBattlesCompleted, waitForHydration, smartSync]);

  const loadPokemon = async (genId = 0, fullRankingMode = false, preserveState = false) => {
    setIsLoading(true);
    try {
      const pokemon = await fetchAllPokemon(genId, fullRankingMode);
      setAllPokemon(pokemon);
      
      if (!preserveState) {
        // Reset battle state if not preserving state
        setBattleResults([]);
        
        // PRESERVE BATTLE COUNT: Don't reset battle count, always use TrueSkill store value
        const currentTotalBattles = useTrueSkillStore.getState().totalBattles;
        console.log(`🌥️ [LOAD_POKEMON] Preserving battle count from TrueSkill store: ${currentTotalBattles}`);
        setBattlesCompleted(currentTotalBattles);
        
        setRankingGenerated(false);
        console.log("🟢 setRankingGenerated explicitly set to FALSE.");

        setSelectedPokemon([]);
        setBattleHistory([]);
        setShowingMilestone(false);
        setCompletionPercentage(0);
      }
      
      // Start the first battle or continue from previous battle
      if (pokemon.length > 0) {
        startNewBattle(pokemon, battleType);
      }
      
      setIsLoading(false);
      return pokemon;
    } catch (error) {
      console.error("Error loading Pokemon:", error);
      toast({
        title: "Error loading Pokémon",
        description: "Could not load Pokémon data. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return [];
    }
  };

  const startNewBattle = (pokemonList: Pokemon[], type: BattleType = battleType) => {
    if (pokemonList.length < 2) {
      toast({
        title: "Not enough Pokémon",
        description: "Need at least 2 Pokémon for a battle.",
        variant: "destructive"
      });
      return;
    }
    
    setBattleType(type);
    
    const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
    const battleSize = type === "triplets" ? 3 : 2;
    setCurrentBattle(shuffled.slice(0, battleSize));
    setSelectedPokemon([]);
  };

  return {
    isLoading,
    setIsLoading,
    allPokemon,
    setAllPokemon,
    currentBattle,
    setCurrentBattle,
    battleType,
    setBattleType,
    loadPokemon,
    startNewBattle
  };
};
