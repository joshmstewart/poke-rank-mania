
import { useManualReorderCore } from './useManualReorderCore';
import { RankedPokemon } from '@/services/pokemon';

export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (newRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean,
  addImpliedBattle?: (winnerId: number, loserId: number) => void
) => {
  console.log(`🔥 [ENHANCED_REORDER_HOOK] Initializing with ${finalRankings.length} rankings`);

  return useManualReorderCore(
    finalRankings,
    onRankingsUpdate,
    preventAutoResorting,
    addImpliedBattle
  );
};
