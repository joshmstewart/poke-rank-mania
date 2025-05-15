
import { useState, useRef, useCallback, useEffect } from "react";
import { Pokemon } from "@/services/pokemon";
import { toast } from "@/hooks/use-toast";
import { BattleType } from "./types";

export const useBattleProcessor = (
  battleResults: any[],
  setBattleResults: React.Dispatch<React.SetStateAction<any[]>>,
  battlesCompleted: number,
  setBattlesCompleted: React.Dispatch<React.SetStateAction<number>>,
  allPokemon: Pokemon[],
  startNewBattle: (pokemon: Pokemon[], battleType: BattleType) => void,
  setShowingMilestone: React.Dispatch<React.SetStateAction<boolean>>,
  milestones: number[],
  generateRankings: (results: any[]) => void,
  setSelectedPokemon: React.Dispatch<React.SetStateAction<number[]>>
) => {
  // Track if processing is happening with a ref to avoid state update issues
  const isProcessingRef = useRef(false);
  // State version for UI consumption
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  // Track the last completed battle count
  const lastBattleCountRef = useRef(battlesCompleted);
  // Use a ref to store all timeout ids for proper cleanup
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  // Track the currently processing battle selection to prevent duplicates
  const currentlyProcessingSelectionRef = useRef<number[] | null>(null);
  // Use a ref to track if a new battle has been started to prevent duplicates
  const hasStartedNewBattleRef = useRef(false);
  // Track the current battle type to detect changes
  const battleTypeRef = useRef<BattleType | null>(null);
  
  // Clean up function to clear all timeouts on unmount or when dependencies change
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, []);

  // Track battle count changes
  useEffect(() => {
    lastBattleCountRef.current = battlesCompleted;
    console.log(`useBattleProcessor: Tracked battle count updated to ${battlesCompleted}`);
  }, [battlesCompleted]);

  // Safe setTimeout function that tracks timeouts for cleanup
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      // Remove this timeout from the tracked list when executed
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
      callback();
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Clear all timeouts to prevent race conditions
  const clearAllTimeouts = useCallback(() => {
    console.log(`useBattleProcessor: Clearing ${timeoutsRef.current.length} timeouts`);
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  const processBattleResult = useCallback((selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    // CRITICAL: Check if we're already processing this exact selection
    if (isProcessingRef.current && 
        currentlyProcessingSelectionRef.current && 
        JSON.stringify(currentlyProcessingSelectionRef.current.sort()) === JSON.stringify(selections.sort())) {
      console.log("useBattleProcessor: Already processing this exact selection, ignoring duplicate", selections);
      return;
    }
    
    // Prevent double processing
    if (isProcessingRef.current) {
      console.log("useBattleProcessor: Already processing a battle result, ignoring");
      return;
    }
    
    console.log("useBattleProcessor: Processing battle result with selections:", selections);
    console.log("useBattleProcessor: Current battle:", currentBattle.map(p => p.name));
    
    // Update the currently processing selection
    currentlyProcessingSelectionRef.current = [...selections];
    
    // Update battle type ref to track changes
    battleTypeRef.current = battleType;
    
    // Set processing flags
    isProcessingRef.current = true;
    setIsProcessingResult(true);
    hasStartedNewBattleRef.current = false;
    
    // Clear any existing timeouts to prevent race conditions
    clearAllTimeouts();
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("useBattleProcessor: No current battle data available");
      isProcessingRef.current = false;
      setIsProcessingResult(false);
      currentlyProcessingSelectionRef.current = null;
      return;
    }

    // Process battle results
    const newResults = [...battleResults];
    
    if (battleType === "pairs") {
      // For pairs, we know who won and who lost
      const winner = currentBattle.find(p => selections.includes(p.id));
      const loser = currentBattle.find(p => !selections.includes(p.id));
      
      if (winner && loser) {
        console.log(`useBattleProcessor: Adding pair result: ${winner.name} beats ${loser.name}`);
        newResults.push({ winner, loser });
      } else {
        console.error("useBattleProcessor: Invalid selection for pair battle", selections, currentBattle);
        isProcessingRef.current = false;
        setIsProcessingResult(false);
        currentlyProcessingSelectionRef.current = null;
        return;
      }
    } else {
      // For triplets/trios, each selected is considered a "winner" against each unselected
      const winners = currentBattle.filter(p => selections.includes(p.id));
      const losers = currentBattle.filter(p => !selections.includes(p.id));
      
      // Only add results if there are winners AND losers
      if (winners.length > 0 && losers.length > 0) {
        console.log(`useBattleProcessor: Adding ${winners.length} winners against ${losers.length} losers`);
        winners.forEach(winner => {
          losers.forEach(loser => {
            console.log(`useBattleProcessor: - ${winner.name} beats ${loser.name}`);
            newResults.push({ winner, loser });
          });
        });
      } else {
        console.error("useBattleProcessor: Invalid selection for triplet battle", selections, currentBattle);
        isProcessingRef.current = false;
        setIsProcessingResult(false);
        currentlyProcessingSelectionRef.current = null;
        return;
      }
    }
    
    // Update battle results first
    setBattleResults(newResults);
    
    // CRITICAL: Increment the battles completed counter
    const newBattlesCompleted = lastBattleCountRef.current + 1;
    console.log(`useBattleProcessor: Incrementing battles completed from ${lastBattleCountRef.current} to ${newBattlesCompleted}`);
    
    // Use safeSetTimeout to ensure state updates happen in sequence
    safeSetTimeout(() => {
      setBattlesCompleted(newBattlesCompleted);
      lastBattleCountRef.current = newBattlesCompleted;
      
      // Use another setTimeout to ensure the state update completes
      safeSetTimeout(() => {
        // Check if we've hit a milestone
        if (milestones.includes(newBattlesCompleted)) {
          console.log(`useBattleProcessor: Milestone reached at ${newBattlesCompleted} battles!`);
          generateRankings(newResults);
          setShowingMilestone(true);
          
          toast({
            title: "Milestone Reached!",
            description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
          });
          
          // Reset processing state after a delay
          safeSetTimeout(() => {
            console.log("useBattleProcessor: Resetting processing state after milestone");
            isProcessingRef.current = false;
            setIsProcessingResult(false);
            currentlyProcessingSelectionRef.current = null;
            hasStartedNewBattleRef.current = false;
          }, 500);
        } else {
          // Clear selections
          setSelectedPokemon([]);
          
          // Start a new battle with a slight delay to ensure state updates
          safeSetTimeout(() => {
            // Validate allPokemon before starting a new battle
            if (!allPokemon || allPokemon.length < 2) {
              console.error("useBattleProcessor: Not enough Pokémon available for battle:", allPokemon?.length || 0);
              toast({
                title: "Error",
                description: "Not enough Pokémon available for battle",
                variant: "destructive"
              });
              isProcessingRef.current = false;
              setIsProcessingResult(false);
              currentlyProcessingSelectionRef.current = null;
              hasStartedNewBattleRef.current = false;
              return;
            }
            
            // Prevent starting multiple new battles
            if (!hasStartedNewBattleRef.current) {
              console.log(`useBattleProcessor: Starting new battle after completing battle #${newBattlesCompleted}`);
              hasStartedNewBattleRef.current = true;
              
              // Start a new battle with the current battle type
              startNewBattle(allPokemon, battleTypeRef.current || battleType);
              
              // Reset processing state after the new battle has started
              safeSetTimeout(() => {
                console.log("useBattleProcessor: Resetting processing state after starting new battle");
                isProcessingRef.current = false;
                setIsProcessingResult(false);
                currentlyProcessingSelectionRef.current = null;
                hasStartedNewBattleRef.current = false;
              }, 500);
            } else {
              console.log("useBattleProcessor: New battle already started, skipping");
            }
          }, 500);
        }
      }, 100);
    }, 200);
  }, [
    battleResults, 
    setBattleResults, 
    battlesCompleted, 
    setBattlesCompleted, 
    allPokemon, 
    startNewBattle, 
    setShowingMilestone, 
    milestones, 
    generateRankings, 
    setSelectedPokemon,
    safeSetTimeout,
    clearAllTimeouts
  ]);

  return { processBattleResult, isProcessingResult };
};
