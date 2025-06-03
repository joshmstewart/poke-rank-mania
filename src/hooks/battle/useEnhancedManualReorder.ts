
import { useManualReorderCore } from './useManualReorderCore';
import { RankedPokemon } from '@/services/pokemon';

// EXPLICIT NOTE: "Implied Battles" logic has been permanently removed.
// This hook now focuses exclusively on manual reordering with direct TrueSkill updates.
export const useEnhancedManualReorder = (
  finalRankings: RankedPokemon[],
  onRankingsUpdate: (newRankings: RankedPokemon[]) => void,
  preventAutoResorting: boolean,
  _deprecatedImpliedBattleParam?: any // Deprecated parameter, no longer used
) => {
  console.log(`🔥 [ENHANCED_REORDER_HOOK] Initializing with ${finalRankings.length} rankings`);
  console.log(`🔥 [ENHANCED_REORDER_HOOK] EXPLICIT NOTE: Implied battles permanently removed`);

  return useManualReorderCore(
    finalRankings,
    onRankingsUpdate,
    preventAutoResorting,
    undefined // No implied battle function needed
  );
};
