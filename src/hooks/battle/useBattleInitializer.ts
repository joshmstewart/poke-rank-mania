
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
  
  const { getTotalBattles, isHydrated } = useTrueSkillStore();

  useEffect(() => {
    // Load battle type from localStorage (this is just UI preference, not data)
    const savedBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
    if (savedBattleType && (savedBattleType === "pairs" || savedBattleType === "triplets")) {
      setBattleType(savedBattleType);
    } else {
      localStorage.setItem('pokemon-ranker-battle-type', "pairs");
    }
  }, []);

  // Wait for hydration and sync battle count
  useEffect(() => {
    const syncBattleCount = () => {
      if (isHydrated) {
        const currentTotalBattles = getTotalBattles();
        console.log(`🌥️ [BATTLE_INIT] Setting battle count from TrueSkill store: ${currentTotalBattles}`);
        setBattlesCompleted(currentTotalBattles);
      }
    };

    syncBattleCount();
  }, [isHydrated, getTotalBattles, setBattlesCompleted]);

  const loadPokemon = async (genId = 0, fullRankingMode = false, preserveState = false) => {
    setIsLoading(true);
    try {
      const pokemon = await fetchAllPokemon(genId, fullRankingMode);
      setAllPokemon(pokemon);
      
      if (!preserveState) {
        // Reset battle state if not preserving state
        setBattleResults([]);
        
        // PRESERVE BATTLE COUNT: Don't reset battle count, always use TrueSkill store value
        const currentTotalBattles = getTotalBattles();
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
