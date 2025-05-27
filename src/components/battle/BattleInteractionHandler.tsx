
import { useCallback, useRef } from "react";

interface BattleInteractionHandlerProps {
  isProcessing: boolean;
  onPokemonSelect: (id: number) => void;
  onTripletSelectionComplete: () => void;
  onGoBack: () => void;
}

export const useBattleInteractionHandler = ({
  isProcessing,
  onPokemonSelect,
  onTripletSelectionComplete,
  onGoBack
}: BattleInteractionHandlerProps) => {
  const lastSelectionRef = useRef<number | null>(null);
  const selectionTimestampRef = useRef(0);

  const handlePokemonCardSelect = useCallback((id: number) => {
    console.log(`🖱️ [BATTLE_INTERACTION] handlePokemonCardSelect:`, {
      id,
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      const now = Date.now();
      
      if (id === lastSelectionRef.current && now - selectionTimestampRef.current < 300) {
        console.log(`⏱️ [BATTLE_INTERACTION] Ignoring repeated selection of Pokemon ${id}`);
        return;
      }
      
      lastSelectionRef.current = id;
      selectionTimestampRef.current = now;
      
      console.log(`🖱️ [BATTLE_INTERACTION] Processing Pokemon selection: ${id}`);
      onPokemonSelect(id);
    } else {
      console.log(`⏳ [BATTLE_INTERACTION] Ignoring click while processing`);
    }
  }, [isProcessing, onPokemonSelect]);

  const handleSubmit = useCallback(() => {
    console.log(`🔄 [BATTLE_INTERACTION] handleSubmit:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[BATTLE_INTERACTION] Submitting triplet selection");
      onTripletSelectionComplete();
    }
  }, [isProcessing, onTripletSelectionComplete]);

  const handleBackClick = useCallback(() => {
    console.log(`🔄 [BATTLE_INTERACTION] handleBackClick:`, {
      isProcessing,
      willIgnore: isProcessing,
      timestamp: new Date().toISOString()
    });
    
    if (!isProcessing) {
      console.log("[BATTLE_INTERACTION] Handling back button click");
      onGoBack();
    }
  }, [isProcessing, onGoBack]);

  return {
    handlePokemonCardSelect,
    handleSubmit,
    handleBackClick
  };
};
