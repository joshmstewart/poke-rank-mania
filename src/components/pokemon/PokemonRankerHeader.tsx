
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
  const generationName = selectedGeneration === 0 ? "All Generations" : `Generation ${selectedGeneration}`;

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
              <AlertDialogTitle>Reset Rankings</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all rankings and suggestions for {generationName}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
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
              <p>Your rankings are automatically saved as you make changes!</p>
              <p>To suggest ranking adjustments, hover over a Pokémon in the rankings view and use the arrow controls.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
