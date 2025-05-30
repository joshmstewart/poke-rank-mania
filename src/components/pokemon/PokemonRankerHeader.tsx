
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info, RefreshCw, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generations } from "@/services/pokemon";
import { useTrueSkillStore } from "@/stores/trueskillStore";
import { toast } from "@/hooks/use-toast";

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
  const { clearAllRatings } = useTrueSkillStore();
  const generationName = selectedGeneration === 0 ? "All Generations" : `Generation ${selectedGeneration}`;

  const handleManualReset = () => {
    console.log("🔄 [MANUAL_RESET_FIXED] ===== MANUAL MODE RESET INITIATED =====");
    
    // Clear TrueSkill store (affects both modes)
    clearAllRatings();
    console.log("🔄 [MANUAL_RESET_FIXED] TrueSkill store cleared");
    
    // Clear Manual mode specific localStorage
    const keysToRemove = [
      'pokemon-active-suggestions',
      'pokemon-ranker-rankings',
      'pokemon-ranker-confidence'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔄 [MANUAL_RESET_FIXED] Cleared: ${key}`);
    });
    
    // Call the original reset function
    onReset();
    
    // Dispatch events to ensure synchronization
    setTimeout(() => {
      const resetEvent = new CustomEvent('manual-mode-reset', {
        detail: { timestamp: Date.now() }
      });
      document.dispatchEvent(resetEvent);
      
      console.log("🔄 [MANUAL_RESET_FIXED] Reset events dispatched");
    }, 50);
    
    toast({
      title: "Manual Mode Reset",
      description: "All rankings and suggestions have been cleared from Manual Mode.",
      duration: 3000
    });
    
    console.log("🔄 [MANUAL_RESET_FIXED] ===== MANUAL MODE RESET COMPLETE =====");
  };

  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow border">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <span className="text-sm font-medium whitespace-nowrap mr-1">Gen:</span>
          <Select 
            value={selectedGeneration.toString()} 
            onValueChange={onGenerationChange}
          >
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Generation" />
            </SelectTrigger>
            <SelectContent align="start" className="min-w-[200px]">
              {generations.map(gen => (
                <SelectItem key={gen.id} value={gen.id.toString()}>
                  {gen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8 text-sm"
          onClick={onToggleRankings}
        >
          <List className="h-4 w-4" /> Rankings
        </Button>
        <AlertDialog open={resetDialogOpen} onOpenChange={onResetDialogChange}>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onResetDialogChange(true)}
            className="flex items-center gap-1 h-8 text-sm"
            title={`Reset rankings for ${generationName}`}
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Manual Mode Rankings</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all rankings and suggestions for {generationName} in Manual Mode. This will also clear any TrueSkill ratings from Battle Mode. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleManualReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
