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
  battleStarter?: any,
  markSuggestionUsed?: (pokemon: RankedPokemon) => void
) => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
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
      const newBattle = shuffled.slice(0, battleSize);
      console.log(`🆕 Selected new random battle: ${newBattle.map(p => p.name).join(", ")}`);
      setCurrentBattle(newBattle);
      setSelectedPokemon([]);
    },
    setSelectedPokemon
  );

  const { processResult } = useBattleResultProcessor(
    battleResults,
    setBattleResults,
    activeTier,
    freezePokemonForTier,
    battleStarter?.trackLowerTierLoss
  );

  const processBattle = useCallback(async (
    selectedPokemonIds: number[],
    currentBattlePokemon: Pokemon[],
    battleType: BattleType,
    currentSelectedGeneration: number = 0
  ) => {
    if (isProcessingResult || milestoneInProgressRef.current) {
      console.log("⏳ Skipping processBattle (already in progress)");
      return;
    }

    console.log("⚔️ Starting processBattle");
    console.log("Selected:", selectedPokemonIds);
    console.log("Current battle:", currentBattlePokemon.map(p => p.name).join(", "));

    setIsProcessingResult(true);

    try {
      const newResults = processResult(selectedPokemonIds, battleType, currentBattlePokemon);

      if (!newResults || newResults.length === 0) {
        console.warn("⚠️ No battle results returned");
        setIsProcessingResult(false);
        return;
      }

      const updatedResults = [...battleResults, ...newResults];
      setBattleResults(updatedResults);
      setSelectedPokemon([]);

      // 🔁 Mark used suggestions
      if (markSuggestionUsed) {
        currentBattlePokemon.forEach(p => {
          const ranked = p as RankedPokemon;
          if (ranked.suggestedAdjustment && !ranked.suggestedAdjustment.used) {
            console.log(`✅ Marking suggestion for ${p.name} as used`);
            markSuggestionUsed(ranked);
          }
        });
      }

      // 🧮 Milestone logic
      const milestone = incrementBattlesCompleted(updatedResults);
      if (typeof milestone === "number") {
        console.log(`🎉 Milestone hit at ${milestone} battles`);
        milestoneInProgressRef.current = true;
        saveRankings(allPokemon, currentSelectedGeneration, "battle");
        generateRankings(updatedResults);
      }

      await setupNextBattle(battleType);
      setIsProcessingResult(false);
    } catch (e) {
      console.error("🔥 Error in processBattle:", e);
      setIsProcessingResult(false);
    }
  }, [
    battleResults,
    processResult,
    incrementBattlesCompleted,
    generateRankings,
    setupNextBattle,
    setSelectedPokemon,
    allPokemon,
    markSuggestionUsed
  ]);

  return {
    processBattleResult: processBattle,
    isProcessingResult
  };
};
