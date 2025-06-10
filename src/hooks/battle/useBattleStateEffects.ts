
import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "./types";

export const useBattleStateEffects = (
  allPokemon: Pokemon[],
  battleType: BattleType,
  selectedGeneration: number,
  frozenPokemon: number[],
  currentBattle: Pokemon[],
  selectedPokemon: number[],
  isAnyProcessing: boolean,
  isProcessingResult: boolean,
  startNewBattle: any,
  getCurrentRankings: () => any,
  setCurrentBattle: (battle: Pokemon[]) => void,
  setSelectedPokemon: (pokemon: number[]) => void,
  handleTripletSelectionComplete: () => void,
  setFinalRankings: (rankings: any) => void
) => {
  const initialBattleStartedRef = useRef(false);
  const processingRef = useRef(false);

  // CRITICAL FIX: Listen for validation battle results and update rankings
  useEffect(() => {
    console.log(`🔧 [BATTLE_STATE_CORE_ULTRA_DEBUG] Setting up validation battle listener`);
    
    const handleValidationBattleCompleted = (event: CustomEvent) => {
      const { primaryPokemonId, opponentPokemonId, primaryWon, battleDetails } = event.detail;
      console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ===== VALIDATION RESULT RECEIVED =====`);
      console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary Pokemon: ${primaryPokemonId}, Opponent: ${opponentPokemonId}, Primary Won: ${primaryWon}`);
      console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Battle details:`, battleDetails);
      
      setFinalRankings(prev => {
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Current rankings before update (length: ${prev.length}):`, prev.map((p, i) => `${i+1}. ${p.name} (${p.id})`));
        
        const currentRankings = [...prev];
        const primaryIndex = currentRankings.findIndex(p => p.id === primaryPokemonId);
        const opponentIndex = currentRankings.findIndex(p => p.id === opponentPokemonId);
        
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary index: ${primaryIndex}, Opponent index: ${opponentIndex}`);
        
        if (primaryIndex === -1 || opponentIndex === -1) {
          console.warn(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Could not find Pokemon in rankings: primary=${primaryIndex}, opponent=${opponentIndex}`);
          return prev;
        }
        
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Current positions - Primary: ${primaryIndex + 1}, Opponent: ${opponentIndex + 1}`);
        
        let rankingChanged = false;
        
        // If the primary Pokemon won and it's ranked lower (higher index), swap them
        if (primaryWon && primaryIndex > opponentIndex) {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary won and was ranked lower - promoting from ${primaryIndex + 1} to ${opponentIndex + 1}`);
          const temp = currentRankings[primaryIndex];
          currentRankings[primaryIndex] = currentRankings[opponentIndex];
          currentRankings[opponentIndex] = temp;
          rankingChanged = true;
        }
        // If the primary Pokemon lost and it's ranked higher (lower index), swap them  
        else if (!primaryWon && primaryIndex < opponentIndex) {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] Primary lost and was ranked higher - demoting from ${primaryIndex + 1} to ${opponentIndex + 1}`);
          const temp = currentRankings[primaryIndex];
          currentRankings[primaryIndex] = currentRankings[opponentIndex];
          currentRankings[opponentIndex] = temp;
          rankingChanged = true;
        } else {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] No ranking change needed - result confirms current positions`);
        }
        
        if (rankingChanged) {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ✅ RANKINGS UPDATED`);
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] New rankings (top 10):`, currentRankings.slice(0, 10).map((p, i) => `${i+1}. ${p.name} (${p.id})`));
        } else {
          console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ❌ No ranking changes made`);
        }
        
        console.log(`🏆 [VALIDATION_HANDLER_ULTRA_DEBUG] ===== VALIDATION RESULT PROCESSED =====`);
        return currentRankings;
      });
    };
    
    document.addEventListener('validation-battle-completed', handleValidationBattleCompleted as EventListener);
    
    return () => {
      document.removeEventListener('validation-battle-completed', handleValidationBattleCompleted as EventListener);
    };
  }, [setFinalRankings]);

  // CRITICAL FIX: Start initial battle when Pokemon are available - with stable dependencies
  useEffect(() => {
    console.log(`🚀 [BATTLE_INIT_ULTRA_DEBUG] Pokemon data check: ${allPokemon?.length || 0} Pokemon available, currentBattle: ${currentBattle?.length || 0}, initialStarted: ${initialBattleStartedRef.current}`);
    
    if (allPokemon && allPokemon.length > 0 && !initialBattleStartedRef.current && (!currentBattle || currentBattle.length === 0)) {
      console.log(`🚀 [BATTLE_INIT_ULTRA_DEBUG] Starting initial battle with ${allPokemon.length} Pokemon`);
      initialBattleStartedRef.current = true;
      
      // Start initial battle immediately without delay
      if (startNewBattle) {
        console.log(`🚀 [BATTLE_INIT_ULTRA_DEBUG] Calling startNewBattle`);
        const initialBattle = startNewBattle(battleType);
        if (initialBattle && initialBattle.length > 0) {
          console.log(`✅ [BATTLE_INIT_ULTRA_DEBUG] Initial battle created:`, initialBattle.map(p => p.name).join(' vs '));
          setCurrentBattle(initialBattle);
          setSelectedPokemon([]);
        } else {
          console.error(`❌ [BATTLE_INIT_ULTRA_DEBUG] Failed to create initial battle`);
        }
      } else {
        console.error(`❌ [BATTLE_INIT_ULTRA_DEBUG] startNewBattle not available`);
      }
    }
  }, [allPokemon.length, battleType, startNewBattle, getCurrentRankings, selectedGeneration, frozenPokemon, currentBattle, setCurrentBattle, setSelectedPokemon]);

  // CRITICAL FIX: Auto-complete pairs battles when 1 Pokemon is selected
  useEffect(() => {
    console.log(`🎯 [AUTO_COMPLETE_ULTRA_DEBUG] Selection changed:`, {
      selectedPokemon,
      selectedCount: selectedPokemon.length,
      battleType,
      isProcessing: isAnyProcessing || isProcessingResult
    });

    if (battleType === "pairs" && selectedPokemon.length === 1 && !isAnyProcessing && !isProcessingResult && !processingRef.current) {
      console.log(`🎯 [AUTO_COMPLETE_ULTRA_DEBUG] Auto-completing pairs battle with selection:`, selectedPokemon[0]);
      handleTripletSelectionComplete();
    }
  }, [selectedPokemon, battleType, isAnyProcessing, isProcessingResult, handleTripletSelectionComplete]);

  return { processingRef };
};
