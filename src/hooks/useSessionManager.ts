
import { toast } from "@/hooks/use-toast";
import { BattleResult } from "./useBattleState";
import { Pokemon } from "@/services/pokemonService";

export interface BattleSessionData {
  selectedGeneration: number;
  battleType: "pairs" | "triplets";
  battleResults: BattleResult;
  battlesCompleted: number;
  battleHistory: { battle: Pokemon[], selected: number[] }[];
  completionPercentage: number;
  fullRankingMode: boolean;
}

export const useSessionManager = (
  importCallback: (data: BattleSessionData) => void
) => {
  // Export battle state data for session sharing
  const exportSessionData = (): string => {
    // This function just returns the stringified session data
    // The actual session data is passed to this function by the component
    try {
      const sessionData = localStorage.getItem('pokemon-battle-state');
      if (!sessionData) {
        throw new Error("No session data available");
      }
      return sessionData;
    } catch (error) {
      console.error('Error exporting session data:', error);
      toast({
        title: "Export Failed",
        description: "Could not export session data.",
        variant: "destructive"
      });
      return "";
    }
  };

  // Import battle state data from session sharing
  const importSessionData = (sessionDataStr: string) => {
    try {
      const sessionData = JSON.parse(sessionDataStr);
      importCallback(sessionData);
    } catch (error) {
      toast({
        title: "Import Error",
        description: "The session data could not be imported.",
        variant: "destructive"
      });
    }
  };

  return {
    exportSessionData,
    importSessionData
  };
};
