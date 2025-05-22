
import React, { useState, useEffect } from "react";
import BattleContent from "./BattleContent";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BattleContentContainerProps {
  allPokemon: Pokemon[];
  initialBattleType?: BattleType;
  initialSelectedGeneration?: number;
}

const BattleContentContainer: React.FC<BattleContentContainerProps> = ({
  allPokemon,
  initialBattleType = "pairs",
  initialSelectedGeneration = 0
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Safety check - immediately verify data and show loading
  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      if (!allPokemon || allPokemon.length === 0) {
        setHasError(true);
        toast({
          title: "Could not load Pokémon data",
          description: "Please try refreshing the page.",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 2000); // 2 second timeout
    
    // If data loaded more quickly, update state immediately
    if (allPokemon && allPokemon.length > 0) {
      clearTimeout(loadTimeout);
      setIsLoading(false);
      setHasError(false);
    }
    
    return () => clearTimeout(loadTimeout);
  }, [allPokemon]);
  
  // If loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Loading Pokémon Data</h2>
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-600">Please wait while we prepare your battle...</p>
        </div>
      </div>
    );
  }

  // If no Pokemon are available, show an error state
  if (!allPokemon || allPokemon.length === 0 || hasError) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">No Pokémon Available</h2>
          <p className="mb-6 text-gray-600">
            We couldn't load any Pokémon data. This could be due to network issues or server problems.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4">
      <BattleContent
        allPokemon={allPokemon}
        initialBattleType={initialBattleType}
        initialSelectedGeneration={initialSelectedGeneration}
      />
    </div>
  );
};

export default BattleContentContainer;
