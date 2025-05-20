
import { useState, useCallback, useRef, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType, SingleBattle } from "./types";

export const useBattleActions = (
  allPokemon: Pokemon[],
  setRankingGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  setBattleResults: React.Dispatch<React.SetStateAction<SingleBattle[]>>,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  setBattleHistory: React.Dispatch<React.SetStateAction<{ battle: Pokemon[], selected: number[] }[]>>,
  setShowingMilestone: (value: boolean) => void,
  setCompletionPercentage: React.Dispatch<React.SetStateAction<number>>,
  startNewBattle: (battleType: BattleType) => void,
  generateRankings: (results: SingleBattle[]) => void,
  battleType: BattleType
) => {
  const [isActioning, setIsActioning] = useState(false);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const actionsQueueRef = useRef<Array<() => void>>([]);
  const milestoneClosingRef = useRef(false);
  
  useEffect(() => {
    // Clean up timeouts on unmount
    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, []);
  
  // Queue system to prevent action collisions
  const queueAction = useCallback((action: () => void) => {
    if (!isActioning) {
      setIsActioning(true);
      
      // Execute action after a small delay to break render cycles
      actionTimeoutRef.current = setTimeout(() => {
        try {
          action();
        } catch (e) {
          console.error("Action error:", e);
        } finally {
          // Release the lock after completion with a delay
          setTimeout(() => {
            setIsActioning(false);
            
            // Process next queued action if any
            if (actionsQueueRef.current.length > 0) {
              const nextAction = actionsQueueRef.current.shift();
              if (nextAction) {
                queueAction(nextAction);
              }
            }
          }, 300);
        }
      }, 50);
    } else {
      // Queue the action for later execution
      console.log("Action queued for later execution");
      actionsQueueRef.current.push(action);
    }
  }, [isActioning]);

  const handleContinueBattles = useCallback(() => {
    if (milestoneClosingRef.current) {
      console.log("Already closing milestone, ignoring duplicate request");
      return;
    }
    
    milestoneClosingRef.current = true;
    
    queueAction(() => {
      console.log("Continue battles action: closing milestone view");
      // First step: close the milestone view
      setShowingMilestone(false);
      
      // Start a new battle after milestone display is closed
      setTimeout(() => {
        console.log("Starting new battle after milestone closed");
        startNewBattle(battleType);
        milestoneClosingRef.current = false;
      }, 500);
    });
  }, [battleType, setShowingMilestone, startNewBattle, queueAction]);

  const handleNewBattleSet = useCallback(() => {
    queueAction(() => {
      console.log("Starting new battle set, cleaning up state");
      
      // First step: close the milestone view if it's open
      setShowingMilestone(false);
      
      // Wait before resetting other state
      setTimeout(() => {
        // Reset all other state in sequence
        setBattleResults([]);
        setBattlesCompleted(0);
        setRankingGenerated(false);
        setBattleHistory([]);
        setCompletionPercentage(0);
        
        // Start new battle at the end with a longer delay
        setTimeout(() => {
          startNewBattle(battleType);
        }, 500);
      }, 500);
    });
  }, [
    battleType, 
    setBattleHistory, 
    setBattleResults, 
    setBattlesCompleted, 
    setCompletionPercentage, 
    setRankingGenerated, 
    setShowingMilestone, 
    startNewBattle,
    queueAction
  ]);

  return {
    handleContinueBattles,
    handleNewBattleSet,
    isActioning
  };
};
