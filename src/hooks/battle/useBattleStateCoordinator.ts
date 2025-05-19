
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";
import { useBattleCoordinatorState } from "./useBattleCoordinatorState";

/**
 * Hook for coordinating battle state initialization and persistence
 */
export interface UseBattleStateCoordinatorProps {
  isLoading: boolean;
  allPokemon: Pokemon[];
  selectedGeneration: number;
  battleType: BattleType;
  battleResults: SingleBattle[];
  battlesCompleted: number;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  completionPercentage: number;
  fullRankingMode: boolean;
  saveBattleState: () => void;
  loadBattleState: () => any | null;
  loadPokemon: (genId?: number, preserveState?: boolean) => Promise<void> | Promise<Pokemon[]>;
  calculateCompletionPercentage: () => void;
}

export const useBattleStateCoordinator = (props: UseBattleStateCoordinatorProps) => {
  // Use the existing coordinator implementation
  return useBattleCoordinatorState(
    props.isLoading,
    props.allPokemon,
    props.selectedGeneration,
    props.battleType,
    props.battleResults,
    props.battlesCompleted,
    props.battleHistory,
    props.completionPercentage,
    props.fullRankingMode,
    props.saveBattleState,
    props.loadBattleState,
    props.loadPokemon,
    props.calculateCompletionPercentage
  );
};
