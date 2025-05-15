
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { 
  Pokemon, 
  fetchAllPokemon, 
  fetchPaginatedPokemon,
  loadRankings,
  ITEMS_PER_PAGE
} from "@/services/pokemon";
import { LoadingType } from "./types";

export function useDataLoader(
  selectedGeneration: number,
  currentPage: number,
  loadSize: number,
  loadingType: LoadingType,
  setAvailablePokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setRankedPokemon: React.Dispatch<React.SetStateAction<Pokemon[]>>,
  setTotalPages: React.Dispatch<React.SetStateAction<number>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      // First try to load saved rankings for the selected generation
      const savedRankings = loadRankings(selectedGeneration);
      
      // Check if we should use pagination (for All Generations)
      if (selectedGeneration === 0) {
        // For single load option, adjust the limit/page size
        const pageSize = loadingType === "single" ? loadSize : ITEMS_PER_PAGE;
        const { pokemon, totalPages: pages } = await fetchPaginatedPokemon(selectedGeneration, currentPage);
        
        setTotalPages(pages);
        
        if (savedRankings.length > 0) {
          // Filter out the already ranked Pokémon from the available list
          const savedIds = new Set(savedRankings.map(p => p.id));
          const remainingPokemon = pokemon.filter(p => !savedIds.has(p.id));
          
          // For infinite scrolling, append to the list
          if (loadingType === "infinite" && currentPage > 1) {
            setAvailablePokemon(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newPokemon = remainingPokemon.filter(p => !existingIds.has(p.id));
              console.log(`Adding ${newPokemon.length} new Pokemon to existing ${prev.length}`);
              return [...prev, ...newPokemon];
            });
          } else {
            setAvailablePokemon(remainingPokemon);
          }
          
          setRankedPokemon(savedRankings);
        } else {
          // For infinite scrolling, append to the list
          if (loadingType === "infinite" && currentPage > 1) {
            setAvailablePokemon(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newPokemon = pokemon.filter(p => !existingIds.has(p.id));
              console.log(`Adding ${newPokemon.length} new Pokemon to existing ${prev.length}. Page: ${currentPage}`);
              return [...prev, ...newPokemon];
            });
          } else {
            setAvailablePokemon(pokemon);
          }
          
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
          
          toast({
            title: "Rankings Loaded",
            description: "Your previously saved rankings have been restored."
          });
        } else {
          setAvailablePokemon(allPokemon);
          setRankedPokemon([]);
        }
      }
    } catch (error) {
      console.error("Error loading Pokémon data:", error);
      toast({
        title: "Error",
        description: "Failed to load Pokémon data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { loadData };
}
