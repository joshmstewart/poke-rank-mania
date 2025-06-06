
import React from "react";
import { Pokemon } from "@/services/pokemon";
import DraggablePokemonMilestoneCard from "@/components/battle/DraggablePokemonMilestoneCard";
import GenerationHeader from "./GenerationHeader";

interface PokemonGridSectionProps {
  items: any[];
  showGenerationHeaders: boolean;
  viewMode: "list" | "grid";
  isRankingArea: boolean;
  isGenerationExpanded?: (generationId: number) => boolean;
  onToggleGeneration?: (generationId: number) => void;
}

export const PokemonGridSection: React.FC<PokemonGridSectionProps> = ({
  items,
  showGenerationHeaders,
  viewMode,
  isRankingArea,
  isGenerationExpanded,
  onToggleGeneration
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isRankingArea ? "No ranked Pokémon yet" : "No available Pokémon"}
      </div>
    );
  }

  // Group items by generation for proper grid rendering
  const renderItems = () => {
    let currentGeneration: number | null = null;
    let currentPokemonBatch: any[] = [];
    const sections: JSX.Element[] = [];

    const flushPokemonBatch = () => {
      if (currentPokemonBatch.length > 0 && currentGeneration !== null) {
        // Only render Pokemon grid if the generation is expanded
        const isExpanded = isGenerationExpanded ? isGenerationExpanded(currentGeneration) : true;
        
        if (isExpanded) {
          sections.push(
            <div key={`pokemon-grid-${currentGeneration}`} className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {currentPokemonBatch.map((pokemon, index) => (
                <DraggablePokemonMilestoneCard
                  key={`pokemon-${pokemon.id}-${index}`}
                  pokemon={pokemon}
                  index={index}
                  isPending={false}
                  showRank={false}
                  isDraggable={true}
                  isAvailable={true}
                />
              ))}
            </div>
          );
        }
        currentPokemonBatch = [];
      }
    };

    items.forEach((item, index) => {
      if (item.type === 'header') {
        // Flush any pending Pokemon before showing header
        flushPokemonBatch();
        
        currentGeneration = item.generationId;
        sections.push(
          <GenerationHeader
            key={`gen-${item.generationId}`}
            generationId={item.generationId}
            name={item.data.name}
            region={item.data.region}
            games={item.data.games}
            viewMode={viewMode}
            isExpanded={isGenerationExpanded ? isGenerationExpanded(item.generationId) : true}
            onToggle={() => onToggleGeneration?.(item.generationId)}
          />
        );
      } else if (item.type === 'pokemon' && item.data) {
        currentPokemonBatch.push(item.data);
      }
    });

    // Flush any remaining Pokemon
    flushPokemonBatch();

    return sections;
  };

  return <div className="space-y-6">{renderItems()}</div>;
};
