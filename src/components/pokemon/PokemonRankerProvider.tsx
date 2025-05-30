
import React, { useEffect, useState } from "react";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { Pokemon } from "@/services/pokemon";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";

interface PokemonRankerProviderProps {
  children: React.ReactNode;
}

const PokemonRankerProvider: React.FC<PokemonRankerProviderProps> = ({ children }) => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const { loadPokemon, isLoading } = usePokemonLoader();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const loadDataWithRetry = async (attempt = 1) => {
    try {
      console.log(`🔒 [MANUAL_MODE_PROVIDER] Loading Pokemon for Manual Mode (Attempt ${attempt}/${MAX_RETRIES})`);
      setErrorDetails("");
      
      // Add a small delay between attempts to avoid overwhelming the API
      if (attempt > 1) {
        console.log(`🔒 [MANUAL_MODE_PROVIDER] Waiting ${RETRY_DELAY}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
      
      const pokemon = await loadPokemon(0, true); // Load all generations
      
      if (pokemon.length === 0) {
        throw new Error("No Pokemon data received from API");
      }
      
      console.log(`🔒 [MANUAL_MODE_PROVIDER] ✅ Successfully loaded ${pokemon.length} Pokemon for Manual Mode`);
      setAllPokemon(pokemon);
      setRetryCount(0);
      setIsRetrying(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`🔒 [MANUAL_MODE_PROVIDER] ❌ Error loading Pokemon (Attempt ${attempt}):`, errorMessage);
      setErrorDetails(errorMessage);
      
      if (attempt < MAX_RETRIES) {
        console.log(`🔒 [MANUAL_MODE_PROVIDER] Will retry in ${RETRY_DELAY}ms... (${attempt}/${MAX_RETRIES})`);
        setIsRetrying(true);
        setRetryCount(attempt);
        
        // Retry after delay
        setTimeout(() => {
          loadDataWithRetry(attempt + 1);
        }, RETRY_DELAY);
      } else {
        console.error(`🔒 [MANUAL_MODE_PROVIDER] ❌ Failed to load Pokemon after ${MAX_RETRIES} attempts`);
        setIsRetrying(false);
        
        // Try to use any cached data as fallback
        const cachedData = localStorage.getItem('pokemon-cache-0-true');
        if (cachedData) {
          try {
            const cached = JSON.parse(cachedData);
            console.log(`🔒 [MANUAL_MODE_PROVIDER] 💾 Using cached data as fallback: ${cached.length} Pokemon`);
            setAllPokemon(cached);
          } catch (e) {
            console.error(`🔒 [MANUAL_MODE_PROVIDER] ❌ Failed to parse cached data:`, e);
          }
        }
      }
    }
  };

  useEffect(() => {
    loadDataWithRetry();
  }, []);

  // Enhanced loading state with retry information
  if (isLoading || isRetrying || allPokemon.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          
          {isRetrying ? (
            <>
              <p className="text-amber-600 font-semibold">
                Network issues detected - Retrying...
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Attempt {retryCount} of {MAX_RETRIES}
              </p>
              {errorDetails && (
                <p className="text-xs text-red-500 mt-1 break-words">
                  Last error: {errorDetails}
                </p>
              )}
            </>
          ) : (
            <>
              <p>Loading Pokémon data for Manual Mode...</p>
              {errorDetails && (
                <p className="text-xs text-red-500 mt-2 break-words">
                  {errorDetails}
                </p>
              )}
            </>
          )}
          
          <button 
            onClick={() => loadDataWithRetry(1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  console.log(`🔒 [MANUAL_MODE_PROVIDER] Providing ${allPokemon.length} Pokemon to Manual Mode context`);
  
  return (
    <PokemonProvider allPokemon={allPokemon}>
      {children}
    </PokemonProvider>
  );
};

export default PokemonRankerProvider;
