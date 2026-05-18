
import React from "react";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import GenerationHeader from "@/components/pokemon/GenerationHeader";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";

interface EnhancedAvailablePokemonContentProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isGenerationExpanded: (genId: number) => boolean;
  onToggleGeneration: (genId: number) => void;
  isLoading: boolean;
  loadingRef: React.RefObject<HTMLDivElement>;
  currentPage: number;
  totalPages: number;
  searchTerm?: string;
  onClearSearch?: () => void;
  pendingIds?: Set<number>;
  canStar?: boolean;
}

// Simple loading placeholder component
const PokemonLoadingPlaceholder = () => (
  <div className="animate-pulse bg-muted rounded-lg h-32 w-full"></div>
);

const EnhancedAvailablePokemonContentImpl: React.FC<EnhancedAvailablePokemonContentProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isGenerationExpanded,
  onToggleGeneration,
  isLoading,
  loadingRef,
  currentPage,
  totalPages,
  searchTerm = "",
  onClearSearch,
  pendingIds = new Set(),
  canStar = true,
}) => {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(640);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const update = () => {
      setViewportHeight(node.clientHeight || 640);
      setContainerWidth(node.clientWidth || 0);
    };
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const columnCount = React.useMemo(() => {
    if (!containerWidth) return 3;
    return Math.max(1, Math.floor((containerWidth + 16) / 156));
  }, [containerWidth]);

  const cardHeight = React.useMemo(() => {
    if (!containerWidth) return 156;
    const gapTotal = (columnCount - 1) * 16;
    return Math.max(140, Math.floor((containerWidth - gapTotal) / columnCount));
  }, [columnCount, containerWidth]);

  const virtualRows = React.useMemo(() => {
    const rows: Array<
      | { type: "header"; key: string; item: any; top: number; height: number }
      | { type: "pokemon"; key: string; pokemon: any[]; startIndex: number; top: number; height: number }
    > = [];
    let top = 0;
    let currentGenerationPokemon: any[] = [];
    let currentGeneration: number | null = null;

    const flushPokemon = () => {
      for (let i = 0; i < currentGenerationPokemon.length; i += columnCount) {
        const rowPokemon = currentGenerationPokemon.slice(i, i + columnCount);
        rows.push({
          type: "pokemon",
          key: `gen-${currentGeneration}-pokemon-row-${i}`,
          pokemon: rowPokemon,
          startIndex: i,
          top,
          height: cardHeight + 16,
        });
        top += cardHeight + 16;
      }
      currentGenerationPokemon = [];
    };

    for (const item of items) {
      if (item.type === "header") {
        flushPokemon();
        rows.push({
          type: "header",
          key: `gen-${item.generationId}`,
          item,
          top,
          height: 76,
        });
        top += 76;
        currentGeneration = item.generationId;
      } else if (item.type === "pokemon") {
        currentGenerationPokemon.push(item.data);
      }
    }
    flushPokemon();

    return { rows, totalHeight: top };
  }, [cardHeight, columnCount, items]);

  const visibleRows = React.useMemo(() => {
    const overscan = viewportHeight * 2;
    const start = Math.max(0, scrollTop - overscan);
    const end = scrollTop + viewportHeight + overscan;
    return virtualRows.rows.filter((row) => row.top + row.height >= start && row.top <= end);
  }, [scrollTop, viewportHeight, virtualRows.rows]);

  // Group items by generation for display
  const renderContent = () => {
    if (items.length === 0 && !isLoading) {
      const isSearching = searchTerm.trim().length > 0;
      if (isSearching) {
        return (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center max-w-xs">
              <SearchX className="mx-auto h-10 w-10 mb-3 opacity-60" />
              <p className="text-base font-medium text-foreground mb-1">
                No matches for &ldquo;{searchTerm}&rdquo;
              </p>
              <p className="text-sm mb-4">
                Check the spelling or try a Pokédex number.
              </p>
              {onClearSearch && (
                <Button variant="outline" size="sm" onClick={onClearSearch}>
                  Clear search
                </Button>
              )}
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">No Pokémon available</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative" style={{ height: virtualRows.totalHeight }}>
        {visibleRows.map((row) => {
          if (row.type === "header") {
            const item = row.item;
            return (
              <div key={row.key} className="absolute left-0 right-0" style={{ top: row.top, height: row.height }}>
                <GenerationHeader
                  generationId={item.generationId}
                  name={item.data.name}
                  region={item.data.region}
                  games={item.data.games}
                  viewMode={viewMode}
                  isExpanded={isGenerationExpanded(item.generationId)}
                  onToggle={() => onToggleGeneration(item.generationId)}
                />
              </div>
            );
          }

          return (
            <div
              key={row.key}
              className="absolute left-0 right-0 grid gap-4"
              style={{
                top: row.top,
                height: row.height,
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                contentVisibility: "auto",
                containIntrinsicSize: `${cardHeight}px ${cardHeight}px`,
              } as React.CSSProperties}
            >
              {row.pokemon.map((pokemon, index) => (
                <DraggablePokemonMilestoneCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  index={row.startIndex + index}
                  isPending={pendingIds.has(pokemon.id)}
                  isStarred={pendingIds.has(pokemon.id)}
                  canStar={canStar}
                  showRank={false}
                  isDraggable={true}
                  isAvailable={true}
                  context="available"
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 transition-colors"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div>
        {renderContent()}
        
        {isLoading && (
          <div ref={loadingRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PokemonLoadingPlaceholder key={`loading-${i}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

EnhancedAvailablePokemonContentImpl.displayName = "EnhancedAvailablePokemonContentImpl";

// PERF: memoize so the available grid doesn't reconcile on every drag-over
// tick (parent re-renders due to insertionPreviewIndex state in the layout
// owner). Only meaningful prop changes will re-render it.
const EnhancedAvailablePokemonContentMemo = React.memo(EnhancedAvailablePokemonContentImpl);
EnhancedAvailablePokemonContentMemo.displayName = "EnhancedAvailablePokemonContent";
export { EnhancedAvailablePokemonContentMemo as EnhancedAvailablePokemonContent };

// Helper functions for generation data
const getRegionForGeneration = (gen: number): string => {
  const regions: Record<number, string> = {
    1: "Kanto",
    2: "Johto", 
    3: "Hoenn",
    4: "Sinnoh",
    5: "Unova",
    6: "Kalos",
    7: "Alola",
    8: "Galar",
    9: "Paldea"
  };
  return regions[gen] || "Unknown";
};

const getGamesForGeneration = (gen: number): string => {
  const games: Record<number, string> = {
    1: "Red, Blue, Yellow",
    2: "Gold, Silver, Crystal",
    3: "Ruby, Sapphire, Emerald",
    4: "Diamond, Pearl, Platinum",
    5: "Black, White, B2W2",
    6: "X, Y, ORAS",
    7: "Sun, Moon, USUM",
    8: "Sword, Shield",
    9: "Scarlet, Violet"
  };
  return games[gen] || "Unknown";
};
