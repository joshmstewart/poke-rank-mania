
import { Pokemon } from "@/services/pokemon";

export type LoadingType = "pagination" | "infinite" | "single";

export interface RankingState {
  isLoading: boolean;
  availablePokemon: Pokemon[];
  rankedPokemon: Pokemon[];
  selectedGeneration: number;
  currentPage: number;
  totalPages: number;
  loadSize: number;
  loadingType: LoadingType;
}

export interface RankingActions {
  setAvailablePokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>;
  setRankedPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>;
  resetRankings: () => void;
  handleGenerationChange: (value: string) => void;
  handlePageChange: (page: number) => void;
  handleLoadingTypeChange: (value: string) => void;
  handleLoadSizeChange: (value: string) => void;
  getPageRange: () => number[];
}
