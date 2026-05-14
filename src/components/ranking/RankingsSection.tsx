
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { shareTopTen } from "@/utils/shareTopTen";
import { toast } from "sonner";

interface RankingsSectionProps {
  displayRankings: (Pokemon | RankedPokemon)[];
  pendingRefinements?: Set<number>;
  availablePokemon?: any[];
  onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
  onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({
  displayRankings,
  pendingRefinements = new Set(),
  availablePokemon = [],
  onManualReorder,
  onLocalReorder
}) => {
  const handleMarkAsPending = (pokemonId: number) => {
    // For manual mode, we don't need special pending logic like battle mode
  };

  const [sharing, setSharing] = React.useState(false);
  const onShare = async () => {
    if (displayRankings.length < 1 || sharing) return;
    setSharing(true);
    try {
      const result = await shareTopTen(displayRankings);
      toast.success(result === "shared" ? "Shared!" : "Downloaded your Top 10 image");
    } catch (e) {
      toast.error("Couldn't generate share image");
      console.error(e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ overflow: 'visible', contain: 'none' }}>
      {/* Streamlined Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Rankings</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 font-medium">
              {displayRankings.length} Pokémon ranked
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onShare}
              disabled={displayRankings.length < 1 || sharing}
              aria-label="Share Top 10"
            >
              <Share2 className="h-4 w-4 mr-1" />
              {sharing ? "Generating…" : "Share Top 10"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Rankings Grid - REMOVED overflow-y-auto to prevent containment */}
      <div className="flex-1 p-4" style={{ overflow: 'visible', contain: 'none' }}>
        <DragDropGrid
          displayRankings={displayRankings}
          localPendingRefinements={pendingRefinements}
          pendingBattleCounts={new Map()}
          onMarkAsPending={handleMarkAsPending}
          onManualReorder={onManualReorder}
          onLocalReorder={onLocalReorder}
          availablePokemon={availablePokemon}
        />
      </div>
    </div>
  );
};
