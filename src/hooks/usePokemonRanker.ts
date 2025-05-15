
import { useState, useEffect, useRef } from "react";
import { 
  Pokemon, 
  fetchAllPokemon, 
  fetchPaginatedPokemon,
  saveRankings, 
  loadRankings, 
  ITEMS_PER_PAGE,
  saveUnifiedSessionData,
  loadUnifiedSessionData
} from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";

export type LoadingType = "pagination" | "infinite" | "single";

export const usePokemonRanker = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [rankedPokemon, setRankedPokemon] = useState<Pokemon[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState(0); // Default to All Generations
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadSize, setLoadSize] = useState(50); // Default to first option
  const [loadingType, setLoadingType] = useState<LoadingType>("pagination");
  
  // For infinite scrolling
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
  // Load data on generation change or page change
  useEffect(() => {
    if (loadingType === "pagination" || loadingType === "single") {
      loadData();
    } else if (loadingType === "infinite" && availablePokemon.length === 0) {
      // Initialize infinite scroll with first page
      loadData();
    }
  }, [selectedGeneration, currentPage, loadSize, loadingType]);
  
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
  
  // Setup infinite scroll observer
  useEffect(() => {
    // Only set up observer when using infinite loading
    if (loadingType === "infinite") {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && currentPage < totalPages) {
          // When the loading element is visible, load more Pokemon
          setCurrentPage(prevPage => prevPage + 1);
        }
      }, { threshold: 0.5 });
      
      if (loadingRef.current) {
        observerRef.current.observe(loadingRef.current);
      }
      
      return () => {
        if (observerRef.current && loadingRef.current) {
          observerRef.current.unobserve(loadingRef.current);
        }
      };
    }
  }, [loadingType, isLoading, currentPage, totalPages]);
  
  const loadData = async () => {
    setIsLoading(true);
    
    // First try to load saved rankings for the selected generation
    const savedRankings = loadRankings(selectedGeneration);
    
    // Check if we should use pagination (for All Generations)
    if (selectedGeneration === 0) {
      // For single load option, fetch with larger page size
      const pageSize = loadingType === "single" ? loadSize : ITEMS_PER_PAGE;
      const { pokemon, totalPages: pages } = await fetchPaginatedPokemon(currentPage);
      
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
    
    setIsLoading(false);
  };
  
  const resetRankings = () => {
    // Get all Pokemon back to available list
    const allPokemon = [...availablePokemon, ...rankedPokemon].sort((a, b) => a.id - b.id);
    setAvailablePokemon(allPokemon);
    setRankedPokemon([]);
    
    // Clear local storage for the current generation
    localStorage.removeItem(`pokemon-rankings-gen-${selectedGeneration}`);
    
    toast({
      title: "Rankings Reset",
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
    setAvailablePokemon([]); // Clear the list for infinite scrolling
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLoadingTypeChange = (value: string) => {
    setLoadingType(value as LoadingType);
    setCurrentPage(1);
    setAvailablePokemon([]);
  };

  const handleLoadSizeChange = (value: string) => {
    setLoadSize(Number(value));
    setCurrentPage(1);
    setAvailablePokemon([]);
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

  return {
    isLoading,
    availablePokemon,
    rankedPokemon,
    selectedGeneration,
    currentPage,
    totalPages,
    loadSize,
    loadingType,
    loadingRef,
    setAvailablePokemon,
    setRankedPokemon,
    resetRankings,
    handleGenerationChange,
    handlePageChange,
    handleLoadingTypeChange,
    handleLoadSizeChange,
    getPageRange
  };
};
