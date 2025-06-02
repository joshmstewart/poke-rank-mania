
import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Pokemon } from "@/services/pokemon";
import { PokemonService } from "@/services/pokemon";
import { useToast } from "@/hooks/use-toast";
import { useFormFilters } from "@/hooks/useFormFilters";

interface PokemonContextType {
  allPokemon: Pokemon[];
  rawUnfilteredPokemon: Pokemon[];
  allGenerationPokemon: Pokemon[];
  isLoading: boolean;
  pokemonService: any;
  currentGeneration: number;
  setCurrentGeneration: (gen: number) => void;
  refreshPokemon: () => Promise<void>;
  pokemonLookupMap: Map<number, Pokemon>; // Add missing property
}

export const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

export const PokemonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allGenerationPokemon, setAllGenerationPokemon] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(1);
  const pokemonService = useMemo(() => new PokemonService(), []);
  const { toast } = useToast();
  const { shouldIncludePokemon } = useFormFilters();

  // Store raw unfiltered Pokemon data for form counting
  const [rawUnfilteredPokemon, setRawUnfilteredPokemon] = useState<Pokemon[]>([]);

  // Create lookup map for Pokemon
  const pokemonLookupMap = useMemo(() => {
    const map = new Map<number, Pokemon>();
    allGenerationPokemon.forEach(pokemon => {
      map.set(pokemon.id, pokemon);
    });
    return map;
  }, [allGenerationPokemon]);

  const loadPokemon = useCallback(async (generation: number) => {
    setIsLoadingGeneration(true);
    try {
      const pokemon = await pokemonService.getPokemonByGeneration(generation);
      setAllGenerationPokemon(pokemon);
      console.log(`✅ [POKEMON_LOAD] Loaded ${pokemon.length} Pokemon for generation ${generation}`);
    } catch (error) {
      console.error("Failed to load Pokemon:", error);
      toast({
        title: "Error",
        description: "Failed to load Pokemon data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGeneration(false);
    }
  }, [pokemonService, toast]);

  useEffect(() => {
    loadPokemon(currentGeneration);
  }, [currentGeneration, loadPokemon]);

  // Add effect to store raw unfiltered data when Pokemon are first loaded
  useEffect(() => {
    if (allGenerationPokemon.length > 0 && rawUnfilteredPokemon.length === 0) {
      console.log(`📝 [RAW_POKEMON_STORAGE] Storing ${allGenerationPokemon.length} raw unfiltered Pokemon for form counting`);
      setRawUnfilteredPokemon([...allGenerationPokemon]);
    }
  }, [allGenerationPokemon, rawUnfilteredPokemon.length]);

  const filteredPokemon = useMemo(() => {
    setIsLoading(true);
    const startTime = performance.now();

    console.log(`🔍 [FILTER_DEBUG] Starting Pokemon filtering for ${allGenerationPokemon.length} Pokemon`);

    if (!allGenerationPokemon || allGenerationPokemon.length === 0) {
      console.log(`🔍 [FILTER_DEBUG] No Pokemon to filter, returning empty array`);
      setIsLoading(false);
      return [];
    }

    const filtered = allGenerationPokemon.filter(pokemon => {
      const shouldInclude = shouldIncludePokemon(pokemon);
      return shouldInclude;
    });

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    console.log(`✅ [FILTER_DEBUG] Filtered ${allGenerationPokemon.length} Pokemon down to ${filtered.length} in ${duration}ms`);
    setIsLoading(false);
    return filtered;
  }, [allGenerationPokemon, shouldIncludePokemon]);

  const refreshPokemon = useCallback(async () => {
    await loadPokemon(currentGeneration);
  }, [loadPokemon, currentGeneration]);

  const contextValue = useMemo(() => ({
    allPokemon: filteredPokemon,
    rawUnfilteredPokemon,
    allGenerationPokemon,
    isLoading: isLoading || isLoadingGeneration,
    pokemonService,
    currentGeneration,
    setCurrentGeneration,
    refreshPokemon,
    pokemonLookupMap
  }), [
    filteredPokemon,
    rawUnfilteredPokemon,
    allGenerationPokemon,
    isLoading,
    isLoadingGeneration,
    pokemonService,
    currentGeneration,
    refreshPokemon,
    pokemonLookupMap
  ]);

  return (
    <PokemonContext.Provider value={contextValue}>
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemonContext = () => {
  const context = React.useContext(PokemonContext);
  if (context === undefined) {
    throw new Error("usePokemonContext must be used within a PokemonProvider");
  }
  return context;
};
