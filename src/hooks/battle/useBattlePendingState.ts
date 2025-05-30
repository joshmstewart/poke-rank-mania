
import { useMemo } from "react";

export const useBattlePendingState = (refinementQueue: any) => {
  // Simplified pending state since validation battles run automatically
  // No need for complex pending tracking as the refinement queue handles everything
  const pendingRefinements = useMemo(() => {
    return new Set<number>(); // Always empty since we don't need visual pending indicators
  }, []);

  const refinementBattleCount = refinementQueue?.queue?.length || refinementQueue?.refinementQueue?.length || refinementQueue?.refinementBattleCount || 0;

  return { pendingRefinements, refinementBattleCount };
};
