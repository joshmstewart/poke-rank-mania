
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { formatPokemonName } from "@/utils/pokemon";
import DraggablePokemonMilestoneCard from "../battle/DraggablePokemonMilestoneCard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface GlobalRankingsViewProps {
  selectedGeneration: number;
}

interface GlobalRanking {
  id: string;
  pokemon_id: number;
  pokemon_name: string;
  generation: number;
  total_battles: number;
  total_wins: number;
  average_rating: number;
  confidence_score: number;
  last_updated: string;
  created_at: string;
}

const GlobalRankingsView: React.FC<GlobalRankingsViewProps> = ({
  selectedGeneration
}) => {
  const [rankings, setRankings] = useState<GlobalRanking[]>([]);
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isAggregating, setIsAggregating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { pokemonLookupMap } = usePokemonContext();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const fetchGlobalRankings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('global_rankings')
        .select('*')
        .order('average_rating', { ascending: false });

      // Filter by generation if not "All"
      if (selectedGeneration > 0) {
        query = query.eq('generation', selectedGeneration);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching global rankings:', fetchError);
        setError('Failed to load global rankings');
        return;
      }

      console.log(`Fetched ${data?.length || 0} global rankings`);
      setRankings(data || []);
    } catch (err) {
      console.error('Error in fetchGlobalRankings:', err);
      setError('Failed to load global rankings');
    } finally {
      setIsLoading(false);
    }
  }, [selectedGeneration]);

  const aggregateRankings = useCallback(async () => {
    try {
      setIsAggregating(true);
      console.log('Triggering global rankings aggregation...');

      const { data, error } = await supabase.functions.invoke('aggregate-global-rankings');

      if (error) {
        console.error('Error aggregating rankings:', error);
        setError('Failed to aggregate rankings');
        return;
      }

      console.log('Aggregation result:', data);
      
      // Refresh the rankings after aggregation
      await fetchGlobalRankings();
    } catch (err) {
      console.error('Error in aggregateRankings:', err);
      setError('Failed to aggregate rankings');
    } finally {
      setIsAggregating(false);
    }
  }, [fetchGlobalRankings]);

  useEffect(() => {
    fetchGlobalRankings();
  }, [fetchGlobalRankings]);

  // Transform rankings to display format
  const displayRankings = rankings.slice(0, displayCount).map((ranking, index) => {
    const pokemon = pokemonLookupMap.get(ranking.pokemon_id);
    
    return {
      id: ranking.pokemon_id,
      name: formatPokemonName(pokemon?.name || ranking.pokemon_name),
      image: pokemon?.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ranking.pokemon_id}.png`,
      types: pokemon?.types || [],
      score: ranking.average_rating,
      count: ranking.total_battles,
      wins: ranking.total_wins,
      losses: ranking.total_battles - ranking.total_wins,
      winRate: ranking.total_battles > 0 ? (ranking.total_wins / ranking.total_battles) * 100 : 0,
      confidence: ranking.confidence_score
    };
  });

  const hasMoreToLoad = displayCount < rankings.length;

  const handleLoadMore = useCallback(() => {
    if (hasMoreToLoad) {
      setDisplayCount(prev => Math.min(prev + 50, rankings.length));
    }
  }, [hasMoreToLoad, rankings.length]);

  // Set up infinite scroll observer
  useEffect(() => {
    if (observerRef.current && loadingRef.current) {
      observerRef.current.unobserve(loadingRef.current);
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (hasMoreToLoad) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          console.log(`Loading more global rankings: ${displayCount} -> ${Math.min(displayCount + 50, rankings.length)}`);
          handleLoadMore();
        }
      }, { 
        rootMargin: '200px',
        threshold: 0.1 
      });
      
      if (loadingRef.current) {
        observerRef.current.observe(loadingRef.current);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreToLoad, displayCount, rankings.length, handleLoadMore]);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Loading Global Rankings...
          </h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-red-600 mb-4">
            Error Loading Rankings
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchGlobalRankings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌍</span>
          <h1 className="text-xl font-bold text-gray-800">
            Global Rankings: {rankings.length} Pokemon
          </h1>
          <span className="text-gray-500 text-sm">
            (Showing {displayRankings.length} of {rankings.length})
          </span>
        </div>
        
        <Button 
          onClick={aggregateRankings} 
          disabled={isAggregating}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isAggregating ? 'animate-spin' : ''}`} />
          {isAggregating ? 'Updating...' : 'Update Rankings'}
        </Button>
      </div>

      {displayRankings.length > 0 ? (
        <>
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {displayRankings.map((pokemon, index) => (
              <DraggablePokemonMilestoneCard
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                showRank={true}
                isDraggable={false}
                isAvailable={false}
                isPending={false}
                context="ranked"
              />
            ))}
          </div>
          
          {/* Infinite scroll loading indicator */}
          {hasMoreToLoad && (
            <div 
              ref={loadingRef}
              className="text-center py-4"
            >
              <div className="text-sm text-gray-500">
                Loading more Pokémon... ({displayRankings.length}/{rankings.length})
              </div>
            </div>
          )}
          
          {!hasMoreToLoad && rankings.length > 0 && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">
                All {rankings.length} ranked Pokémon loaded
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            No Global Rankings Yet
          </h3>
          <p className="text-gray-500 mb-4">
            No battle data has been aggregated yet. Click "Update Rankings" to aggregate data from all users.
          </p>
          <Button onClick={aggregateRankings} disabled={isAggregating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAggregating ? 'animate-spin' : ''}`} />
            {isAggregating ? 'Updating...' : 'Update Rankings'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GlobalRankingsView;
