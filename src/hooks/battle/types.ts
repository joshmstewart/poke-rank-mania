
import { Pokemon } from "@/services/pokemon";

// Keep "triplets" as the internal value for backward compatibility
export type BattleType = "pairs" | "triplets";

// ✅ Represents one winner/loser pair with additional battle metadata
export type SingleBattle = {
  battleType: BattleType;
  generation: number;
  pokemonIds: number[];
  selectedPokemonIds: number[];
  timestamp: string;
  winner?: Pokemon;
  loser?: Pokemon;
};

// ✅ Represents an array of battle results (used throughout the app)
export type BattleResult = SingleBattle[];

export interface BattleState {
  selectedGeneration: number;
  battleType: BattleType;
  battleResults: SingleBattle[];
  battlesCompleted: number;
  battleHistory: { battle: Pokemon[]; selected: number[] }[];
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
  battleResults: SingleBattle[];
  selectedPokemon: number[];
  battlesCompleted: number;
  rankingGenerated: boolean;
  finalRankings: Pokemon[];
  battleHistory: { battle: Pokemon[]; selected: number[] }[];
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
  startNewBattle: (pokemonList: Pokemon[], battleType?: BattleType) => void;
}
