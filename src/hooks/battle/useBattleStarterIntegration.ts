
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { toast } from "@/hooks/use-toast";

export const useBattleStarterIntegration = (
  allPokemon: Pokemon[],
  currentRankings: RankedPokemon[],
  setCurrentBattle: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const battleStarter = useMemo(() => {
    if (!allPokemon || allPokemon.length === 0) return null;

    return createBattleStarter(
      allPokemon,
      allPokemon,
      currentRankings, // already of type RankedPokemon[]
      setCurrentBattle
    );
  }, [allPokemon, currentRankings, setCurrentBattle]);

  const { performEmergencyReset } = useBattleEmergencyReset(
    [] as Pokemon[],
    setCurrentBattle,
    allPokemon
  );

  return {
    battleStarter,
    startNewBattle: battleStarter?.startNewBattle || (() => [])
  };
};
