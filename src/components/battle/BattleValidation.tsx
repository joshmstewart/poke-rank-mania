
import { useMemo } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { validateBattlePokemon } from "@/services/pokemon/api/utils";
import { toast } from "@/hooks/use-toast";

interface BattleValidationProps {
  currentBattle: Pokemon[];
  battleType: BattleType;
  onValidationWarning?: (message: string) => void;
}

export const useBattleValidation = ({ currentBattle, battleType, onValidationWarning }: BattleValidationProps) => {
  const validatedBattle = useMemo(() => {
    if (!currentBattle || currentBattle.length === 0) {
      console.log(`⚠️ [BATTLE_VALIDATION] No battle data available`);
      return [];
    }
    
    const validated = validateBattlePokemon(currentBattle);
    console.log(`✅ [BATTLE_VALIDATION] Validated ${validated.length} Pokémon for battle`);
    
    const expectedCount = battleType === "triplets" ? 3 : 2;
    if (validated.length !== expectedCount) {
      const warningMessage = `Expected ${expectedCount} Pokémon for ${battleType} battles, but got ${validated.length}. This will be fixed automatically.`;
      console.warn(`⚠️ [BATTLE_VALIDATION] BATTLE TYPE MISMATCH: ${warningMessage}`);
      
      if (onValidationWarning) {
        onValidationWarning(warningMessage);
      } else {
        toast({
          title: "Battle Type Mismatch",
          description: warningMessage,
          duration: 3000,
        });
      }
    }
    
    return validated;
  }, [currentBattle, battleType, onValidationWarning]);

  return { validatedBattle };
};
