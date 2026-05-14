
import React from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";
import DragDropGrid from "@/components/battle/DragDropGrid";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { shareTopTen } from "@/utils/shareTopTen";
import { toast } from "sonner";
import { useDroppable } from "@dnd-kit/core";

const EmptyRankingsDropZone: React.FC = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: "rankings-drop-zone",
    data: { type: "rankings-container" },
  });
  return (
    <div
      ref={setNodeRef}
      className={`flex h-full min-h-[200px] flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg transition-colors ${
        isOver
          ? "border-primary bg-primary/5 text-foreground"
          : "border-border text-muted-foreground"
      }`}
    >
      <p className="text-base font-medium mb-1">No Pokémon ranked yet</p>
      <p className="text-sm">
        Drag a Pokémon here from the left, or tap the <span className="font-semibold">+</span> button on a card to add it.
      </p>
    </div>
  );
};

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
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Your Rankings</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground font-medium">
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
        {displayRankings.length === 0 ? (
          <EmptyRankingsDropZone />
        ) : (
          <DragDropGrid
            displayRankings={displayRankings}
            localPendingRefinements={pendingRefinements}
            pendingBattleCounts={new Map()}
            onMarkAsPending={handleMarkAsPending}
            onManualReorder={onManualReorder}
            onLocalReorder={onLocalReorder}
            availablePokemon={availablePokemon}
          />
        )}
      </div>
    </div>
  );
};
