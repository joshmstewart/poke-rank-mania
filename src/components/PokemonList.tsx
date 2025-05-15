
import React, { useState, useMemo } from "react";
import { Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import PokemonCard from "./PokemonCard";
import { Pokemon, generations } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import { Search, List, Grid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PokemonListProps {
  title: string;
  pokemonList: Pokemon[];
  droppableId: string;
  onDragEnd?: (result: DropResult) => void;
  isRankingArea?: boolean;
}

// Function to get generation info for a Pokemon
const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(gen => 
    pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};

// Mapping of generation IDs to regions and games
const generationDetails: Record<number, { region: string, games: string }> = {
  1: { region: "Kanto", games: "Red, Blue, Yellow" },
  2: { region: "Johto", games: "Gold, Silver, Crystal" },
  3: { region: "Hoenn", games: "Ruby, Sapphire, Emerald" },
  4: { region: "Sinnoh", games: "Diamond, Pearl, Platinum" },
  5: { region: "Unova", games: "Black, White, Black 2, White 2" },
  6: { region: "Kalos", games: "X, Y" },
  7: { region: "Alola", games: "Sun, Moon, Ultra Sun, Ultra Moon" },
  8: { region: "Galar", games: "Sword, Shield" },
  9: { region: "Paldea", games: "Scarlet, Violet" }
};

const PokemonList = ({ 
  title, 
  pokemonList, 
  droppableId, 
  onDragEnd,
  isRankingArea = false
}: PokemonListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Group Pokemon by generation and apply searching
  const groupedAndFilteredPokemon = useMemo(() => {
    // First filter by search term
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // If this is the ranking area or we're searching, don't group by generation
    if (isRankingArea || searchTerm) {
      return {
        items: filtered.map(pokemon => ({ type: 'pokemon', data: pokemon })),
        showGenerationHeaders: false
      };
    }
    
    // Group by generation for the available Pokemon list
    const result = [];
    let lastGeneration: number | null = null;
    
    for (const pokemon of filtered) {
      const generation = getPokemonGeneration(pokemon.id);
      
      if (generation && generation.id !== lastGeneration) {
        // Add a header for new generation
        result.push({ 
          type: 'header', 
          generationId: generation.id,
          data: {
            name: generation.name,
            region: generationDetails[generation.id]?.region || "Unknown",
            games: generationDetails[generation.id]?.games || ""
          }
        });
        lastGeneration = generation.id;
      }
      
      // Add the Pokemon
      result.push({ type: 'pokemon', data: pokemon });
    }
    
    return {
      items: result,
      showGenerationHeaders: true
    };
  }, [pokemonList, searchTerm, isRankingArea]);

  return (
    <div className={`flex flex-col h-full ${isRankingArea ? 'relative' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "list" | "grid")}>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Pokemon..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className={`flex-1 overflow-auto bg-gray-50 rounded-lg p-2 min-h-[400px] ${isRankingArea ? 'z-10' : ''}`}>
        <Droppable droppableId={droppableId}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`
                ${viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-2" : "space-y-2"} 
                h-full ${snapshot.isDraggingOver && isRankingArea ? 'bg-green-50 border-2 border-dashed border-green-500 rounded' : ''}
              `}
            >
              {groupedAndFilteredPokemon.items.length > 0 ? (
                groupedAndFilteredPokemon.items.map((item, index) => {
                  if (item.type === 'header') {
                    // Render generation header
                    return (
                      <div 
                        key={`header-${item.generationId}`} 
                        className={`${viewMode === "grid" ? "col-span-full" : ""} bg-gradient-to-r from-primary/10 to-transparent p-2 rounded-md my-2`}
                      >
                        <h3 className="font-bold">{item.data.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Region: {item.data.region} | Games: {item.data.games}
                        </p>
                      </div>
                    );
                  } else {
                    // Render Pokemon card
                    const pokemon = item.data;
                    let draggableIndex = index;
                    
                    // If showing generation headers, we need to adjust the draggable index
                    // to account for the non-draggable headers
                    if (groupedAndFilteredPokemon.showGenerationHeaders) {
                      draggableIndex = groupedAndFilteredPokemon.items
                        .slice(0, index)
                        .filter(i => i.type === 'pokemon')
                        .length;
                    }
                    
                    return (
                      <Draggable
                        key={`${pokemon.id}-${droppableId}`}
                        draggableId={`${pokemon.id}-${droppableId}`}
                        index={draggableIndex}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <PokemonCard
                              pokemon={pokemon}
                              isDragging={snapshot.isDragging}
                              viewMode={viewMode}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  }
                })
              ) : (
                <div className={`flex items-center justify-center ${viewMode === "grid" ? "col-span-full" : ""} h-32 text-muted-foreground`}>
                  {searchTerm ? "No Pokemon found" : "No Pokemon here yet"}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
      
      {/* Full-screen droppable overlay that appears when dragging and this is the ranking area */}
      {isRankingArea && (
        <Droppable droppableId={`${droppableId}-overlay`}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`absolute inset-0 z-0 ${snapshot.isDraggingOver ? 'bg-green-100/50' : ''}`}
              style={{ 
                display: snapshot.isDraggingOver ? 'block' : 'none',
                pointerEvents: snapshot.isDraggingOver ? 'auto' : 'none'
              }}
            >
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default PokemonList;
