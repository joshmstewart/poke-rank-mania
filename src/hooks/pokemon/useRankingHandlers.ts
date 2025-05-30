
import { toast } from "@/hooks/use-toast";
import { LoadingType } from "./types";

interface UseRankingHandlersProps {
  setSelectedGeneration: (value: number) => void;
  setCurrentPage: (value: number) => void;
  setAvailablePokemon: (value: any) => void;
  setLoadingType: (value: LoadingType) => void;
  setLoadSize: (value: number) => void;
  availablePokemon: any[];
  rankedPokemon: any[];
  setRankedPokemon: (value: any) => void;
  setConfidenceScores: (value: any) => void;
}

export const useRankingHandlers = ({
  setSelectedGeneration,
  setCurrentPage,
  setAvailablePokemon,
  setLoadingType,
  setLoadSize,
  availablePokemon,
  rankedPokemon,
  setRankedPokemon,
  setConfidenceScores
}: UseRankingHandlersProps) => {
  const resetRankings = () => {
    const allPokemon = [...availablePokemon, ...rankedPokemon].sort((a, b) => a.id - b.id);
    setAvailablePokemon(allPokemon);
    setRankedPokemon([]);
    setConfidenceScores({});
    
    console.log("[POKEMON_RANKER_CLOUD] Resetting rankings in cloud storage");
    
    toast({
      title: "Rankings Reset",
      description: "Your rankings have been cleared from cloud storage."
    });
  };

  const handleGenerationChange = (value: string) => {
    const newGenId = Number(value);
    setSelectedGeneration(newGenId);
    setCurrentPage(1);
    setAvailablePokemon([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLoadingTypeChange = (value: string) => {
    setLoadingType(value as LoadingType);
    setCurrentPage(1);
    setAvailablePokemon([]);
  };

  const handleLoadSizeChange = (value: string) => {
    setLoadSize(Number(value));
    setCurrentPage(1);
    setAvailablePokemon([]);
  };

  return {
    resetRankings,
    handleGenerationChange,
    handlePageChange,
    handleLoadingTypeChange,
    handleLoadSizeChange
  };
};
