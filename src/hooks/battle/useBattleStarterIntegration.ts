import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import { BattleType } from "./types";
import { createBattleStarter } from "./createBattleStarter";
import { useBattleEmergencyReset } from "./useBattleEmergencyReset";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import * as React from "react";

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

  // your existing logic continues here...
  // (you don’t need to change anything else in this file unless you’ve modified toast JSX — which we already fixed)
  
  return {
    battleStarter,
    startNewBattle: battleStarter?.startNewBattle || (() => [])
  };
};
