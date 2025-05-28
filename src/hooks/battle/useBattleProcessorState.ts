
import { useState, useRef, useEffect } from "react";

export const useBattleProcessorState = () => {
  const [isProcessingResult, setIsProcessingResult] = useState(false);
  const isResettingRef = useRef(false);

  console.log(`🔄 [PROCESSOR_FIX] useBattleProcessorState isProcessingResult:`, {
    isProcessingResult,
    timestamp: new Date().toISOString()
  });

  // LOADING STATE DEBUG: Log isProcessingResult changes
  useEffect(() => {
    console.log(`🔄 [LOADING DEBUG] useBattleProcessorState isProcessingResult changed:`, {
      isProcessingResult,
      timestamp: new Date().toISOString()
    });
  }, [isProcessingResult]);

  return {
    isProcessingResult,
    setIsProcessingResult,
    isResettingRef
  };
};
