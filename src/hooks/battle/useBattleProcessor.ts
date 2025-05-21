import { useState, useCallback, useRef } from "react";
import { Pokemon, RankedPokemon, TopNOption } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleProgression } from "./useBattleProgression";
import { useNextBattleHandler } from "./useNextBattleHandler";
import { useBattleResultProcessor } from "./useBattleResultProcessor";
import { saveRankings } from "@/services/pokemon";

export const useBattleProcessor = (
  battleResults: SingleBattle[],
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: SingleBattle[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>,
  activeTier?: TopNOption,
  freezePokemonForTier?: (pokemonId: number, tier: TopNOption) => void,
  battleStarter?: any, // Accept the battle starter to access trackLowerTierLoss
  markSuggestionUsed?: (pokemon: RankedPokemon) => void // New parameter
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const processedMilestonesRef = useRef<Set<number>>(new Set());
  const milestoneInProgressRef = useRef(false);

  const { incrementBattlesCompleted } = useBattleProgression(
    battlesCompleted,
    setBattlesCompleted,
    setShowingMilestone,
    milestones,
    generateRankings
  );

  const { setupNextBattle } = useNextBattleHandler(
    allPokemon,
    (battleType: BattleType) => {
      const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
      const battleSize = battleType === "triplets" ? 3 : 2;
      setCurrentBattle(shuffled.slice(0, battleSize));
      setSelectedPokemon([]);
    },
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(
    battleResults, 
    setBattleResults,
    activeTier,
    freezePokemonForTier,
    battleStarter?.trackLowerTierLoss // Pass the function if available
  );

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log("Already processing a battle or milestone, ignoring");
      return;
    }
    
    console.log(`Processing battle with selected IDs: ${selectedPokemonIds.join(", ")}`);
    setIsProcessingResult(true);

    try {
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);
      
      if (newResults && newResults.length > 0) {
        const cumulativeResults = [...battleResults, ...newResults];
        setBattleResults(cumulativeResults);
        
        // CRITICAL FIX: ALWAYS check for suggestions in battle Pokemon and mark them used when appropriate
        if (markSuggestionUsed) {
          // Check if any current battle Pokemon have suggestions that should be marked as used
          currentBattlePokemon.forEach(pokemon => {
            const pokemonWithSuggestion = pokemon as RankedPokemon;
            if (pokemonWithSuggestion.suggestedAdjustment && !pokemonWithSuggestion.suggestedAdjustment.used) {
              console.log(`✅ Marking suggestion for ${pokemon.name} as used in battle`);
              markSuggestionUsed(pokemonWithSuggestion);
            }
          });
        }
        
        // Check if milestone is reached
        const nextMilestone = incrementBattlesCompleted();
        if (nextMilestone) {
          console.log(`🎉 Milestone reached: ${nextMilestone} battles`);
          console.log(`⚠️ Saving rankings at milestone WITHOUT clearing suggestions`);
          
          // CRITICAL FIX: Force a save to localStorage here
          saveRankings(allPokemon, currentSelectedGeneration, "battle");
          
          // CRITICAL FIX: Log current battle conditions for verification
          console.log(`🔍 Current battle conditions at milestone ${nextMilestone}:`, {
            battleType,
            pokemonCount: currentBattlePokemon.length,
            pokemonNames: currentBattlePokemon.map(p => p.name)
          });
          
          milestoneInProgressRef.current = true;
          generateRankings(cumulativeResults);
          
          // CRITICAL FIX: Direct localStorage check to verify suggestions
          try {
            const savedSuggestions = localStorage.getItem('pokemon-active-suggestions');
            console.log(`💾 DIRECT VERIFICATION AT MILESTONE: Suggestions in localStorage: ${savedSuggestions ? "YES" : "NO"}`);
            if (savedSuggestions) {
              try {
                const parsed = JSON.parse(savedSuggestions);
                console.log(`🔢 Found ${Object.keys(parsed).length} suggestions saved in localStorage at milestone`);
              } catch (e) {
                console.error("Error parsing saved suggestions:", e);
              }
            }
          } catch (e) {
            console.error("Error checking localStorage during milestone:", e);
          }
        }
        
        // Reset the selected Pokemon
        setSelectedPokemon([]);
        setIsProcessingResult(false);
        return newResults.length;
      }
      
      setIsProcessingResult(false);
      return 0;
    } catch (error) {
      console.error("Error processing battle result:", error);
      setIsProcessingResult(false);
      return 0;
    }
  }, [battleResults, setBattleResults, processResult, incrementBattlesCompleted, generateRankings, setSelectedPokemon, allPokemon, markSuggestionUsed]);

  // Function to reset the milestone in progress flag
  const resetMilestoneInProgress = useCallback(() => {
    milestoneInProgressRef.current = false;
  }, []);

  return {
    processBattleResult: processBattle,
    isProcessingResult,
    resetMilestoneInProgress
  };
};
