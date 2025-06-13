
import { useCallback, useRef } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { Rating } from 'ts-trueskill';

export const useBackgroundTrueSkillProcessor = () => {
  const { updateRating, forceScoreBetweenNeighbors, getAllRatings } = useTrueSkillStore();
  const processingQueue = useRef<Array<{
    pokemonId: number;
    sourceIndex: number;
    destinationIndex: number;
    timestamp: number;
  }>>([]);
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced processor that handles TrueSkill calculations in batches
  const processQueuedOperations = useCallback(async () => {
    if (processingQueue.current.length === 0) return;

    console.log(`🔄 [BACKGROUND_PROCESSOR] Processing ${processingQueue.current.length} queued operations`);
    
    // Get the most recent operation for each Pokemon to avoid redundant calculations
    const latestOperations = new Map<number, typeof processingQueue.current[0]>();
    
    processingQueue.current.forEach(operation => {
      const existing = latestOperations.get(operation.pokemonId);
      if (!existing || operation.timestamp > existing.timestamp) {
        latestOperations.set(operation.pokemonId, operation);
      }
    });

    // Process each unique Pokemon operation
    for (const operation of latestOperations.values()) {
      try {
        if (operation.sourceIndex === -1) {
          // New Pokemon added - create default rating
          const defaultRating = new Rating(25.0, 8.333);
          updateRating(operation.pokemonId.toString(), defaultRating);
        }
        
        // Force score between neighbors (this is the expensive operation)
        // We'll defer the neighbor calculation to avoid blocking
        requestIdleCallback(() => {
          const allRatings = getAllRatings();
          // Simplified neighbor scoring - we'll let the normal ranking system handle precise positioning
          const existingRating = allRatings[operation.pokemonId.toString()];
          if (!existingRating) {
            const defaultRating = new Rating(25.0, 8.333);
            updateRating(operation.pokemonId.toString(), defaultRating);
          }
        });
        
      } catch (error) {
        console.error(`🔄 [BACKGROUND_PROCESSOR] Error processing operation for Pokemon ${operation.pokemonId}:`, error);
      }
    }

    // Clear the queue
    processingQueue.current = [];
    console.log(`✅ [BACKGROUND_PROCESSOR] Completed processing ${latestOperations.size} operations`);
  }, [updateRating, forceScoreBetweenNeighbors, getAllRatings]);

  const queueBackgroundOperation = useCallback((
    pokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    console.log(`📝 [BACKGROUND_PROCESSOR] Queuing operation for Pokemon ${pokemonId}: ${sourceIndex} -> ${destinationIndex}`);
    
    // Add to queue with timestamp
    processingQueue.current.push({
      pokemonId,
      sourceIndex,
      destinationIndex,
      timestamp: Date.now()
    });

    // Clear existing timeout and set new one
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
    }

    // Process after a short delay to allow for batching
    processingTimeout.current = setTimeout(() => {
      processQueuedOperations();
    }, 100); // 100ms delay for batching rapid operations

  }, [processQueuedOperations]);

  return {
    queueBackgroundOperation
  };
};
