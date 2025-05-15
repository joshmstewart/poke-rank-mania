
import { useState, useRef, useCallback } from "react";
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
  // Use a ref to track if a new battle has been started
  const hasStartedNewBattleRef = useRef(false);
  // Use a ref to store timeout ids for cleanup
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Clean up function to clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

  // Safe setTimeout function that tracks timeouts for cleanup
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback();
      // Remove this timeout from the tracked list
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const processBattleResult = useCallback((selections: number[], battleType: BattleType, currentBattle: Pokemon[]) => {
    // Prevent double processing
    if (isProcessingRef.current) {
      console.log("processBattleResult: Already processing a battle result, ignoring");
      return;
    }
    
    console.log("processBattleResult: Processing battle result with selections:", selections);
    console.log("processBattleResult: Current battle:", currentBattle.map(p => p.name));
    
    // Set processing flags
    isProcessingRef.current = true;
    setIsProcessingResult(true);
    hasStartedNewBattleRef.current = false;
    
    // Clear any existing timeouts to prevent race conditions
    clearAllTimeouts();
    
    if (!currentBattle || currentBattle.length === 0) {
      console.error("processBattleResult: No current battle data available");
      isProcessingRef.current = false;
      setIsProcessingResult(false);
      return;
    }

    // Process battle results
    const newResults = [...battleResults];
    
    if (battleType === "pairs") {
      // For pairs, we know who won and who lost
      const winner = currentBattle.find(p => selections.includes(p.id));
      const loser = currentBattle.find(p => !selections.includes(p.id));
      
      if (winner && loser) {
        console.log(`processBattleResult: Adding pair result: ${winner.name} beats ${loser.name}`);
        newResults.push({ winner, loser });
      } else {
        console.error("processBattleResult: Invalid selection for pair battle", selections, currentBattle);
        isProcessingRef.current = false;
        setIsProcessingResult(false);
        return;
      }
    } else {
      // For triplets/trios, each selected is considered a "winner" against each unselected
      const winners = currentBattle.filter(p => selections.includes(p.id));
      const losers = currentBattle.filter(p => !selections.includes(p.id));
      
      // Only add results if there are winners AND losers
      if (winners.length > 0 && losers.length > 0) {
        console.log(`processBattleResult: Adding ${winners.length} winners against ${losers.length} losers`);
        winners.forEach(winner => {
          losers.forEach(loser => {
            console.log(`processBattleResult: - ${winner.name} beats ${loser.name}`);
            newResults.push({ winner, loser });
          });
        });
      } else {
        console.error("processBattleResult: Invalid selection for triplet battle", selections, currentBattle);
        isProcessingRef.current = false;
        setIsProcessingResult(false);
        return;
      }
    }
    
    // Update battle results first
    setBattleResults(newResults);
    
    // CRITICAL: Increment the battles completed counter
    const newBattlesCompleted = battlesCompleted + 1;
    console.log(`processBattleResult: Incrementing battles completed from ${battlesCompleted} to ${newBattlesCompleted}`);
    lastBattleCountRef.current = newBattlesCompleted;
    
    safeSetTimeout(() => {
      setBattlesCompleted(newBattlesCompleted);
      
      // Use another setTimeout to ensure the state update completes
      safeSetTimeout(() => {
        // Check if we've hit a milestone
        if (milestones.includes(newBattlesCompleted)) {
          console.log(`processBattleResult: Milestone reached at ${newBattlesCompleted} battles!`);
          generateRankings(newResults);
          setShowingMilestone(true);
          
          toast({
            title: "Milestone Reached!",
            description: `You've completed ${newBattlesCompleted} battles. Check out your current ranking!`
          });
          
          // Reset processing state after a delay
          safeSetTimeout(() => {
            isProcessingRef.current = false;
            setIsProcessingResult(false);
          }, 500);
        } else {
          // Clear selections
          setSelectedPokemon([]);
          
          // Start a new battle with a slight delay to ensure state updates
          safeSetTimeout(() => {
            // Validate allPokemon before starting a new battle
            if (!allPokemon || allPokemon.length < 2) {
              console.error("processBattleResult: Not enough Pokémon available for battle:", allPokemon?.length || 0);
              toast({
                title: "Error",
                description: "Not enough Pokémon available for battle",
                variant: "destructive"
              });
              isProcessingRef.current = false;
              setIsProcessingResult(false);
              return;
            }
            
            if (!hasStartedNewBattleRef.current) {
              console.log(`processBattleResult: Starting new battle after completing battle #${newBattlesCompleted}`);
              hasStartedNewBattleRef.current = true;
              
              // Start a new battle
              startNewBattle(allPokemon, battleType);
              
              // Reset processing state after the new battle has started
              safeSetTimeout(() => {
                isProcessingRef.current = false;
                setIsProcessingResult(false);
              }, 500);
            } else {
              console.log("processBattleResult: New battle already started, skipping");
              isProcessingRef.current = false;
              setIsProcessingResult(false);
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
