import { Pokemon } from "@/services/pokemon";

// Keep "triplets" as the internal value for backward compatibility
export type BattleType = "pairs" | "triplets";
export type BattleResult = { winner: Pokemon, loser: Pokemon }[];

export interface BattleState {
  selectedGeneration: number;
  battleType: BattleType;
  battleResults: BattleResult;
  battlesCompleted: number;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  completionPercentage: number;
  fullRankingMode: boolean;
}

export interface BattleContextValue {
  isLoading: boolean;
  selectedGeneration: number;
  setSelectedGeneration: (gen: number) => void;
  allPokemon: Pokemon[];
  battleType: BattleType;
  setBattleType: (type: BattleType) => void;
  currentBattle: Pokemon[];
  battleResults: BattleResult;
  selectedPokemon: number[];
  battlesCompleted: number;
  rankingGenerated: boolean;
  finalRankings: Pokemon[];
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  showingMilestone: boolean;
  completionPercentage: number;
  fullRankingMode: boolean;
  setFullRankingMode: (value: boolean) => void;
  milestones: number[];
  handleGenerationChange: (value: string) => void;
  handleBattleTypeChange: (value: string) => void;
  handlePokemonSelect: (id: number) => void;
  handleTripletSelectionComplete: () => void;
  handleSaveRankings: () => void;
  handleContinueBattles: () => void;
  handleNewBattleSet: () => void;
  goBack: () => void;
  getBattlesRemaining: () => number;
  loadPokemon: (genId?: number, preserveState?: boolean) => Promise<void>;
  startNewBattle: (pokemonList: Pokemon[]) => void;
}
