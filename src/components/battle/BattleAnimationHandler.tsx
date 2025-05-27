
import { useState, useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";

interface BattleAnimationHandlerProps {
  validatedBattle: Pokemon[];
  battleType: BattleType;
}

export const useBattleAnimationHandler = ({ validatedBattle, battleType }: BattleAnimationHandlerProps) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [previousBattleIds, setPreviousBattleIds] = useState<number[]>([]);
  const lastProcessedBattleRef = useRef<number[]>([]);

  useEffect(() => {
    if (!validatedBattle || validatedBattle.length === 0) {
      console.log(`⚠️ [BATTLE_ANIMATION] No validated battle data available`);
      return;
    }
    
    const currentIds = validatedBattle.map(p => p.id);
    
    const isSameAsPreviousProcessed = lastProcessedBattleRef.current.length === currentIds.length && 
      lastProcessedBattleRef.current.every(id => currentIds.includes(id)) &&
      currentIds.every(id => lastProcessedBattleRef.current.includes(id));
      
    if (isSameAsPreviousProcessed) {
      console.log("🔍 [BATTLE_ANIMATION] Same battle as processed, skipping animation update");
      return;
    }
    
    lastProcessedBattleRef.current = currentIds;
    setAnimationKey(prev => prev + 1);
      
    const currentNames = validatedBattle.map(p => p.name);
    const isSameAsPrevious = previousBattleIds.length === currentIds.length && 
      previousBattleIds.every(id => currentIds.includes(id));
    
    console.log(`🔄 [BATTLE_ANIMATION] Battle change: [${currentIds.join(',')}] (${currentNames.join(', ')}) - Same as previous: ${isSameAsPrevious ? "YES ⚠️" : "NO ✅"}`);
    
    setPreviousBattleIds(currentIds);
  }, [validatedBattle.map(p => p.id).join(','), battleType]);

  return { animationKey };
};
