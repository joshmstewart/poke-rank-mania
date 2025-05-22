
import React, { useEffect, useState, useRef } from "react";
import BattleContentContainer from "@/components/battle/BattleContentContainer";
import { usePokemonLoader } from "@/hooks/battle/usePokemonLoader";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const BattleMode = () => {
  const { allPokemon, isLoading, loadPokemon } = usePokemonLoader();
  const [loadingInitiated, setLoadingInitiated] = useState(false);
  const loaderInitiatedRef = useRef(false);
  const loadingFailedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 2;
  
  // Improved Pokémon loading with retry mechanism and safety timeout
  useEffect(() => {
    let timeoutId: number;
    let isMounted = true;
    
    // Create a safety timeout to force isLoading to false if it gets stuck
    timeoutId = window.setTimeout(() => {
      if (isMounted && isLoading && !allPokemon.length) {
        console.error("Loading timeout triggered - forcing state reset");
        loadingFailedRef.current = true;
        toast({
          title: "Loading timeout",
          description: "Taking too long to load. Please refresh the page.",
          variant: "destructive"
        });
      }
    }, 20000) as unknown as number;
    
    const loadPokemonWithRetry = async () => {
      // Only load pokemon once to prevent infinite loops, unless there was a failure
      if (!loaderInitiatedRef.current || loadingFailedRef.current) {
        try {
          loaderInitiatedRef.current = true;
          setLoadingInitiated(true);
          loadingFailedRef.current = false;
          console.log("Loading Pokémon data...");
          
          const result = await loadPokemon(0, true);
          if (isMounted) {
            console.log(`Loaded ${result?.length || 0} Pokémon successfully`);
            
            // Reset retry count on success
            retryCountRef.current = 0;
          }
        } catch (error) {
          console.error("Failed to load Pokémon:", error);
          if (isMounted) {
            loadingFailedRef.current = true;
            retryCountRef.current += 1;
            
            if (retryCountRef.current < maxRetries) {
              toast({
                title: "Loading failed",
                description: "Retrying to load Pokémon data...",
                variant: "destructive"
              });
              
              // Retry after a delay
              setTimeout(loadPokemonWithRetry, 2000);
            } else {
              toast({
                title: "Error loading Pokémon",
                description: "Could not load Pokémon data after multiple attempts. Please refresh the page.",
                variant: "destructive"
              });
            }
          }
        }
      }
    };

    loadPokemonWithRetry();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [loadPokemon]);

  // Emergency rescue to render something even when loading appears stuck
  const isLoadingStuck = isLoading && loadingInitiated && retryCountRef.current >= maxRetries;
  
  if (isLoading && !allPokemon.length && !isLoadingStuck) {
    return (
      <div className="flex justify-center items-center h-64 w-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p>Loading Pokémon data...</p>
          {retryCountRef.current > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Attempt {retryCountRef.current + 1} of {maxRetries + 1}...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Emergency recovery rendering - show something even if we're "stuck" loading
  if (isLoadingStuck) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-4 max-w-md">
          <h2 className="text-lg font-semibold mb-2">Having trouble loading Pokémon</h2>
          <p className="mb-3">We couldn't load the Pokémon data after multiple attempts.</p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Render with even empty data to try to break out of loading state
  return (
    <div className="flex flex-col items-center w-full py-4 px-4 sm:px-6">
      <BattleContentContainer
        allPokemon={allPokemon.length > 0 ? allPokemon : []} 
        initialBattleType="pairs"
        initialSelectedGeneration={0}
      />
    </div>
  );
};

export default BattleMode;
