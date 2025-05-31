
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, List } from "lucide-react";
import UnifiedControls from "../shared/UnifiedControls";

interface PokemonRankerHeaderProps {
  selectedGeneration: number;
  showRankings: boolean;
  resetDialogOpen: boolean;
  onGenerationChange: (value: string) => void;
  onToggleRankings: () => void;
  onResetDialogChange: (open: boolean) => void;
  onReset: () => void;
}

export const PokemonRankerHeader: React.FC<PokemonRankerHeaderProps> = ({
  selectedGeneration,
  showRankings,
  resetDialogOpen,
  onGenerationChange,
  onToggleRankings,
  onResetDialogChange,
  onReset
}) => {
  const handleManualModeReset = () => {
    console.log(`🔄 [MANUAL_MODE_RESET] Performing Manual mode specific reset actions`);
    
    // Clear Manual mode specific localStorage (this is in addition to what UnifiedControls does)
    const manualSpecificKeys = [
      'pokemon-active-suggestions',
      'pokemon-ranker-rankings',
      'pokemon-ranker-confidence'
    ];
    
    manualSpecificKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔄 [MANUAL_MODE_RESET] Cleared manual-specific: ${key}`);
    });
    
    // Call the original reset function for any React state cleanup
    onReset();
  };

  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow border mb-4">
      <div className="flex-1">
        <UnifiedControls
          selectedGeneration={selectedGeneration}
          onGenerationChange={onGenerationChange}
          showBattleTypeControls={false}
          mode="manual"
          onReset={onReset}
          customResetAction={handleManualModeReset}
        />
      </div>
      
      <div className="flex gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8 text-sm"
          onClick={onToggleRankings}
        >
          <List className="h-4 w-4" /> Rankings
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to use Pokémon Ranking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <p>Your rankings are automatically loaded from your Battle Mode progress!</p>
              <p>To suggest ranking adjustments, hover over a Pokémon in the rankings view and use the arrow controls.</p>
              <p>Rankings are based on TrueSkill ratings calculated from your battles.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
