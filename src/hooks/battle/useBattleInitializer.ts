
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
  
  const { getAllRatings, isHydrated } = useTrueSkillStore();

  useEffect(() => {
    // Load battle type from localStorage
    const savedBattleType = localStorage.getItem('pokemon-ranker-battle-type') as BattleType;
    if (savedBattleType && (savedBattleType === "pairs" || savedBattleType === "triplets")) {
      setBattleType(savedBattleType);
    } else {
      // Set default to "pairs" if not valid in localStorage
      localStorage.setItem('pokemon-ranker-battle-type', "pairs");
    }
  }, []);

  // CRITICAL FIX: Sync battle count with TrueSkill store when hydrated
  useEffect(() => {
    if (isHydrated) {
      const ratings = getAllRatings();
      const totalBattles = Object.values(ratings).reduce((sum, rating) => {
        return sum + (rating.battleCount || 0);
      }, 0);
      
      console.log(`🔄 [BATTLE_COUNT_SYNC] Syncing battle count from TrueSkill: ${totalBattles}`);
      setBattlesCompleted(totalBattles);
      
      // Also update localStorage for consistency
      localStorage.setItem('pokemon-battle-count', totalBattles.toString());
    }
  }, [isHydrated, getAllRatings, setBattlesCompleted]);

  const loadPokemon = async (genId = 0, fullRankingMode = false, preserveState = false) => {
    setIsLoading(true);
    try {
      const pokemon = await fetchAllPokemon(genId, fullRankingMode);
      setAllPokemon(pokemon);
      
      if (!preserveState) {
        // Reset battle state if not preserving state
        setBattleResults([]);
        
        // CRITICAL FIX: Don't reset battle count to 0, get it from TrueSkill
        if (isHydrated) {
          const ratings = getAllRatings();
          const totalBattles = Object.values(ratings).reduce((sum, rating) => {
            return sum + (rating.battleCount || 0);
          }, 0);
          setBattlesCompleted(totalBattles);
        } else {
          setBattlesCompleted(0);
        }
        
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
      // Not enough Pokémon for a battle
      toast({
        title: "Not enough Pokémon",
        description: "Need at least 2 Pokémon for a battle.",
        variant: "destructive"
      });
      return;
    }
    
    // Update current battle type
    setBattleType(type);
    
    // Shuffle the list to get random Pokémon
    const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
    
    // Get the first 2 or 3 Pokémon based on battle type
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
