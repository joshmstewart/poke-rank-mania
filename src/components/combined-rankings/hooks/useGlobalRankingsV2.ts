
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GlobalRanking {
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
  rankings: GlobalRanking[];
  totalCount: number;
}

interface UseGlobalRankingsV2Options {
  generation?: string;
  minUsers?: number;
}

export const useGlobalRankingsV2 = (options: UseGlobalRankingsV2Options = {}) => {
  return useQuery({
    queryKey: ['global-rankings-v2', options.generation, options.minUsers],
    queryFn: async (): Promise<GlobalRankingsResponse> => {
      console.log('🌍 [GLOBAL_RANKINGS_HOOK] Fetching global rankings with options:', options);

      const params = new URLSearchParams();
      if (options.generation && options.generation !== 'all') {
        params.append('generation', options.generation);
      }
      if (options.minUsers) {
        params.append('minUsers', options.minUsers.toString());
      }

      const { data, error } = await supabase.functions.invoke('get-global-pokemon-rankings-v2', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: params.toString() ? `?${params.toString()}` : undefined
      });

      if (error) {
        console.error('🌍 [GLOBAL_RANKINGS_HOOK] Error:', error);
        throw error;
      }

      console.log('🌍 [GLOBAL_RANKINGS_HOOK] Received data:', data);
      return data as GlobalRankingsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};
