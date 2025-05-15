
import React, { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Save, Info } from "lucide-react";
import PokemonList from "./PokemonList";
import { Pokemon, fetchAllPokemon, saveRankings, loadRankings, exportRankings, generations } from "@/services/pokemonService";
import { toast } from "@/hooks/use-toast";

const PokemonRanker = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [rankedPokemon, setRankedPokemon] = useState<Pokemon[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(1);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // First try to load saved rankings for the selected generation
      const savedRankings = loadRankings(selectedGeneration);
      
      // Then fetch all Pokemon for the selected generation
      const allPokemon = await fetchAllPokemon(selectedGeneration);
      
      if (savedRankings.length > 0) {
        // Filter out the already ranked Pokemon from available list
        const savedIds = new Set(savedRankings.map(p => p.id));
        const remainingPokemon = allPokemon.filter(p => !savedIds.has(p.id));
        
        setRankedPokemon(savedRankings);
        setAvailablePokemon(remainingPokemon);
        
        toast({
          title: "Rankings loaded",
          description: "Your previously saved rankings have been restored.",
        });
      } else {
        setAvailablePokemon(allPokemon);
        setRankedPokemon([]);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [selectedGeneration]);
  
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside of any droppable area
    if (!destination) return;
    
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
  
  const handleSave = () => {
    saveRankings(rankedPokemon, selectedGeneration);
  };
  
  const handleExport = () => {
    exportRankings(rankedPokemon, selectedGeneration);
  };
  
  const resetRankings = () => {
    // Get all Pokemon back to available list
    const allPokemon = [...availablePokemon, ...rankedPokemon].sort((a, b) => a.id - b.id);
    setAvailablePokemon(allPokemon);
    setRankedPokemon([]);
    
    // Clear local storage for the current generation
    localStorage.removeItem(`pokemon-rankings-gen-${selectedGeneration}`);
    
    toast({
      title: "Rankings reset",
      description: "Your rankings have been cleared."
    });
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pokémon Rank Mania</h1>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to use Pokémon Rank Mania</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p>Drag Pokémon from the left panel to your ranking list on the right.</p>
                  <p>Rearrange them in your preferred order from favorite (top) to least favorite (bottom).</p>
                  <p>Use the search box to find specific Pokémon quickly.</p>
                  <p>Don't forget to save your progress using the Save button!</p>
                  <p>You can also export your rankings as a JSON file to share or keep for reference.</p>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={resetRankings} variant="outline">Reset Rankings</Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button onClick={handleExport} variant="secondary" className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="flex items-center mb-4">
          <div className="w-64">
            <Select value={selectedGeneration.toString()} onValueChange={(value) => setSelectedGeneration(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                {generations.map((gen) => (
                  <SelectItem key={gen.id} value={gen.id.toString()}>
                    {gen.name} (#{gen.start}-{gen.end})
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
                  </div>
                  <div>
                    <PokemonList
                      title="Your Rankings"
                      pokemonList={rankedPokemon}
                      droppableId="ranked"
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
