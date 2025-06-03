
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalRankedPokemon {
  pokemonId: number;
  name: string;
  image: string;
  generationId: number;
  types: string[];
  globalRank: number;
  averageScore: number;
  usersRankedCount: number;
}

interface GlobalRankingsResponse {
  success: boolean;
  data: GlobalRankedPokemon[];
  meta: {
    totalPokemon: number;
    generationFilter: number | null;
    minUsersFilter: number;
  };
  error?: string;
}

interface UseGlobalRankingsProps {
  generation?: number;
  minUsers?: number;
  enabled?: boolean;
}

export const useGlobalRankings = ({
  generation,
  minUsers = 3,
  enabled = true
}: UseGlobalRankingsProps = {}) => {
  const [data, setData] = useState<GlobalRankedPokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<GlobalRankingsResponse['meta'] | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchGlobalRankings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching global rankings...', { generation, minUsers });

        const params = new URLSearchParams({
          minUsers: minUsers.toString()
        });

        if (generation) {
          params.append('generation', generation.toString());
        }

        const { data: response, error: supabaseError } = await supabase.functions.invoke(
          'get-global-pokemon-rankings',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (supabaseError) {
          throw supabaseError;
        }

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch global rankings');
        }

        console.log(`Loaded ${response.data.length} global rankings`);
        setData(response.data);
        setMeta(response.meta);

      } catch (err) {
        console.error('Error fetching global rankings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalRankings();
  }, [generation, minUsers, enabled]);

  const refetch = () => {
    if (enabled) {
      // Trigger a new fetch by updating a dependency
    }
  };

  return {
    data,
    isLoading,
    error,
    meta,
    refetch
  };
};
