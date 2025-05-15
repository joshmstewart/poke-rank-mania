import React, { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, AlertTriangle } from "lucide-react";
import PokemonList from "./PokemonList";
import { 
  Pokemon, 
  fetchAllPokemon, 
  fetchPaginatedPokemon,
  saveRankings, 
  loadRankings, 
  generations,
  ITEMS_PER_PAGE,
  saveUnifiedSessionData,
  loadUnifiedSessionData
} from "@/services/pokemonService";
import { toast } from "@/hooks/use-toast";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const PokemonRanker = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [rankedPokemon, setRankedPokemon] = useState<Pokemon[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(0); // Default to All Generations
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    loadData();
  }, [selectedGeneration, currentPage]);
  
  // Add auto-save functionality
  useEffect(() => {
    // Only save when rankedPokemon changes and is not empty
    if (rankedPokemon.length > 0) {
      // Use a short delay to avoid excessive saves during drag operations
      const saveTimer = setTimeout(() => {
        saveRankings(rankedPokemon, selectedGeneration);
      }, 1000);
      
      return () => clearTimeout(saveTimer);
    }
  }, [rankedPokemon, selectedGeneration]);
  
  const loadData = async () => {
    setIsLoading(true);
    
    // First try to load saved rankings for the selected generation
    const savedRankings = loadRankings(selectedGeneration);
    
    // Check if we should use pagination (for All Generations)
    if (selectedGeneration === 0) {
      const { pokemon, totalPages: pages } = await fetchPaginatedPokemon(selectedGeneration, currentPage);
      setTotalPages(pages);
      
      if (savedRankings.length > 0) {
        // Filter out the already ranked Pokémon from the available list
        const savedIds = new Set(savedRankings.map(p => p.id));
        const remainingPokemon = pokemon.filter(p => !savedIds.has(p.id));
        
        setAvailablePokemon(remainingPokemon);
        setRankedPokemon(savedRankings);
      } else {
        setAvailablePokemon(pokemon);
        setRankedPokemon([]);
      }
    } else {
      // For specific generations, use the original function
      const allPokemon = await fetchAllPokemon(selectedGeneration);
      
      if (savedRankings.length > 0) {
        // Filter out the already ranked Pokemon from available list
        const savedIds = new Set(savedRankings.map(p => p.id));
        const remainingPokemon = allPokemon.filter(p => !savedIds.has(p.id));
        
        setRankedPokemon(savedRankings);
        setAvailablePokemon(remainingPokemon);
        
        toast("Rankings loaded", {
          description: "Your previously saved rankings have been restored."
        });
      } else {
        setAvailablePokemon(allPokemon);
        setRankedPokemon([]);
      }
    }
    
    setIsLoading(false);
  };
  
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside of any droppable area
    if (!destination) return;
    
    // Check if the destination is the overlay area
    if (destination.droppableId === "ranked-overlay") {
      // When dropped on the overlay, add to the end of the ranked list
      const sourceItems = Array.from(availablePokemon);
      const destItems = Array.from(rankedPokemon);
      
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.push(movedItem); // Add to the end
      
      setAvailablePokemon(sourceItems);
      setRankedPokemon(destItems);
      return;
    }
    
    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "available") {
        const newItems = Array.from(availablePokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        setAvailablePokemon(newItems);
      } else if (source.droppableId === "ranked") {
        const newItems = Array.from(rankedPokemon);
        const [movedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, movedItem);
        setRankedPokemon(newItems);
      }
    } 
    // Moving from one list to another
    else {
      if (source.droppableId === "available" && destination.droppableId === "ranked") {
        // Moving from available to ranked
        const sourceItems = Array.from(availablePokemon);
        const destItems = Array.from(rankedPokemon);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);
        
        setAvailablePokemon(sourceItems);
        setRankedPokemon(destItems);
      } else if (source.droppableId === "ranked" && destination.droppableId === "available") {
        // Moving from ranked to available
        const sourceItems = Array.from(rankedPokemon);
        const destItems = Array.from(availablePokemon);
        
        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);
        
        setRankedPokemon(sourceItems);
        setAvailablePokemon(destItems);
      }
    }
  };
  
  const resetRankings = () => {
    // Get all Pokemon back to available list
    const allPokemon = [...availablePokemon, ...rankedPokemon].sort((a, b) => a.id - b.id);
    setAvailablePokemon(allPokemon);
    setRankedPokemon([]);
    
    // Clear local storage for the current generation
    localStorage.removeItem(`pokemon-rankings-gen-${selectedGeneration}`);
    
    toast("Rankings reset", {
      description: "Your rankings have been cleared."
    });
    
    // Also update the unified session data
    const sessionData = loadUnifiedSessionData();
    if (sessionData.rankings) {
      delete sessionData.rankings[`gen-${selectedGeneration}`];
      saveUnifiedSessionData(sessionData);
    }
  };

  const handleGenerationChange = (value: string) => {
    const newGenId = Number(value);
    setSelectedGeneration(newGenId);
    setCurrentPage(1); // Reset to page 1 when changing generations
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate page range for pagination
  const getPageRange = () => {
    const range = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // If total pages is small enough, show all pages
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always include first page
      range.push(1);
      
      // Calculate start and end of middle range
      let middleStart = Math.max(2, currentPage - 1);
      let middleEnd = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust to always show 3 pages in middle if possible
      if (middleEnd - middleStart < 2) {
        if (middleStart === 2) {
          middleEnd = Math.min(4, totalPages - 1);
        } else if (middleEnd === totalPages - 1) {
          middleStart = Math.max(2, totalPages - 3);
        }
      }
      
      // Add ellipsis after first page if needed
      if (middleStart > 2) {
        range.push(-1); // Use -1 as a signal for ellipsis
      }
      
      // Add middle pages
      for (let i = middleStart; i <= middleEnd; i++) {
        range.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (middleEnd < totalPages - 1) {
        range.push(-2); // Use -2 as another signal for ellipsis
      }
      
      // Always include last page
      range.push(totalPages);
    }
    
    return range;
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manual Ranking</h1>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to use Pokémon Ranking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p>Drag Pokémon from the left panel to your ranking list on the right.</p>
                  <p>Rearrange them in your preferred order from favorite (top) to least favorite (bottom).</p>
                  <p>Use the search box to find specific Pokémon quickly.</p>
                  <p>You can choose to rank Pokémon within a specific generation or across all generations.</p>
                  <p>All Generations mode uses pagination for better performance.</p>
                  <p>Your rankings are automatically saved as you make changes!</p>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={resetRankings} variant="outline">Reset Rankings</Button>
          </div>
        </div>

        <div className="flex items-center mb-4">
          <div className="w-64">
            <Select value={selectedGeneration.toString()} onValueChange={handleGenerationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                {generations.map((gen) => (
                  <SelectItem key={gen.id} value={gen.id.toString()}>
                    {gen.name} {gen.id === 0 ? (
                      <span className="text-green-600 ml-2">(Paginated)</span>
                    ) : (
                      <span>(#{gen.start}-{gen.end})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="rank" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="rank">Rank Pokémon</TabsTrigger>
            <TabsTrigger value="results">View Rankings</TabsTrigger>
          </TabsList>
          <TabsContent value="rank" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Loading Pokémon...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedGeneration === 0 
                      ? `Loading page ${currentPage} of All Generations...` 
                      : `Loading Generation ${selectedGeneration}...`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <PokemonList
                      title="Available Pokémon"
                      pokemonList={availablePokemon}
                      droppableId="available"
                    />
                    
                    {/* Pagination for All Generations */}
                    {selectedGeneration === 0 && totalPages > 1 && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                aria-disabled={currentPage === 1}
                                tabIndex={currentPage === 1 ? -1 : 0}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            
                            {getPageRange().map((page, i) => (
                              <PaginationItem key={`page-${i}`}>
                                {page < 0 ? (
                                  <span className="flex h-9 w-9 items-center justify-center">...</span>
                                ) : (
                                  <PaginationLink
                                    isActive={currentPage === page}
                                    onClick={() => handlePageChange(page)}
                                  >
                                    {page}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                aria-disabled={currentPage === totalPages}
                                tabIndex={currentPage === totalPages ? -1 : 0}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                        
                        <div className="text-center text-sm text-muted-foreground mt-2">
                          Page {currentPage} of {totalPages} • 
                          Showing {ITEMS_PER_PAGE} Pokémon per page
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <PokemonList
                      title="Your Rankings"
                      pokemonList={rankedPokemon}
                      droppableId="ranked"
                      isRankingArea={true}
                    />
                  </div>
                </div>
              </DragDropContext>
            )}
          </TabsContent>
          <TabsContent value="results" className="mt-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Your Pokémon Rankings</h2>
              {rankedPokemon.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-16">ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedPokemon.map((pokemon, index) => (
                      <TableRow key={pokemon.id}>
                        <TableCell className="font-bold">{index + 1}</TableCell>
                        <TableCell>
                          <div className="w-10 h-10">
                            <img 
                              src={pokemon.image} 
                              alt={pokemon.name} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{pokemon.name}</TableCell>
                        <TableCell>#{pokemon.id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>You haven't ranked any Pokémon yet.</p>
                  <p className="mt-2">Go to the "Rank Pokémon" tab to get started!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PokemonRanker;
