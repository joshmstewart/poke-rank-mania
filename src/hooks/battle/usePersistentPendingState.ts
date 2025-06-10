
import { useState, useCallback, useEffect, useRef } from 'react';

// Use a separate localStorage key that won't be touched by cloud sync
const PENDING_STATE_KEY = 'pokemon-refinement-queue-pending';
const PENDING_EVENT_KEY = 'pokemon-refinement-queue-events';

export const usePersistentPendingState = () => {
  const [pendingPokemon, setPendingPokemon] = useState<Set<number>>(new Set());
  const syncBlockRef = useRef(false);
  
  console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Hook initialized`);

  // Load pending state on initialization
  useEffect(() => {
    const loadPendingState = () => {
      try {
        const stored = localStorage.getItem(PENDING_STATE_KEY);
        if (stored) {
          const pokemonIds = JSON.parse(stored);
          const pendingSet = new Set<number>(pokemonIds);
          setPendingPokemon(pendingSet);
          console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Loaded ${pendingSet.size} pending Pokemon:`, Array.from(pendingSet));
        }
      } catch (error) {
        console.error(`🔒🔒🔒 [PERSISTENT_PENDING] Error loading pending state:`, error);
      }
    };

    loadPendingState();
  }, []);

  // Save pending state to localStorage
  const savePendingState = useCallback((newPendingSet: Set<number>) => {
    if (syncBlockRef.current) {
      console.log(`🔒🔒🔒 [PERSISTENT_PENDING] ⏸️ Save blocked during sync operation`);
      return;
    }
    
    try {
      const pokemonIds = Array.from(newPendingSet);
      localStorage.setItem(PENDING_STATE_KEY, JSON.stringify(pokemonIds));
      
      // Also store individual keys for backwards compatibility
      pokemonIds.forEach(id => {
        localStorage.setItem(`pokemon-pending-${id}`, 'true');
      });
      
      console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Saved ${pokemonIds.length} pending Pokemon:`, pokemonIds);
    } catch (error) {
      console.error(`🔒🔒🔒 [PERSISTENT_PENDING] Error saving pending state:`, error);
    }
  }, []);

  // Add Pokemon to pending state
  const addPendingPokemon = useCallback((pokemonId: number) => {
    console.log(`🔒🔒🔒 [PERSISTENT_PENDING] ===== ADDING POKEMON ${pokemonId} TO PENDING =====`);
    
    setPendingPokemon(prev => {
      const newSet = new Set(prev);
      newSet.add(pokemonId);
      
      // Save immediately
      setTimeout(() => {
        savePendingState(newSet);
      }, 0);
      
      console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Added Pokemon ${pokemonId}. Total pending: ${newSet.size}`);
      return newSet;
    });
  }, [savePendingState]);

  // Remove Pokemon from pending state
  const removePendingPokemon = useCallback((pokemonId: number) => {
    console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Removing Pokemon ${pokemonId} from pending`);
    
    setPendingPokemon(prev => {
      const newSet = new Set(prev);
      newSet.delete(pokemonId);
      
      // Save immediately and clean up individual keys
      setTimeout(() => {
        savePendingState(newSet);
        localStorage.removeItem(`pokemon-pending-${pokemonId}`);
      }, 0);
      
      console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Removed Pokemon ${pokemonId}. Total pending: ${newSet.size}`);
      return newSet;
    });
  }, [savePendingState]);

  // Clear all pending Pokemon
  const clearAllPending = useCallback(() => {
    console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Clearing all pending Pokemon`);
    
    // Clear individual keys
    pendingPokemon.forEach(id => {
      localStorage.removeItem(`pokemon-pending-${id}`);
    });
    
    // Clear main storage
    localStorage.removeItem(PENDING_STATE_KEY);
    
    setPendingPokemon(new Set());
    console.log(`🔒🔒🔒 [PERSISTENT_PENDING] All pending Pokemon cleared`);
  }, [pendingPokemon]);

  // Check if Pokemon is pending
  const isPokemonPending = useCallback((pokemonId: number): boolean => {
    const isPending = pendingPokemon.has(pokemonId);
    console.log(`🔒🔒🔒 [PERSISTENT_PENDING] Check pending for ${pokemonId}: ${isPending}`);
    return isPending;
  }, [pendingPokemon]);

  // Get all pending Pokemon IDs
  const getAllPendingIds = useCallback((): number[] => {
    const ids = Array.from(pendingPokemon);
    console.log(`🔒🔒🔒 [PERSISTENT_PENDING] All pending IDs:`, ids);
    return ids;
  }, [pendingPokemon]);

  // Block sync during cloud operations
  const blockSync = useCallback(() => {
    syncBlockRef.current = true;
    console.log(`🔒🔒🔒 [PERSISTENT_PENDING] ⏸️ Sync blocked`);
    
    // Auto-unblock after 5 seconds
    setTimeout(() => {
      syncBlockRef.current = false;
      console.log(`🔒🔒🔒 [PERSISTENT_PENDING] ✅ Sync unblocked`);
    }, 5000);
  }, []);

  return {
    pendingPokemon: Array.from(pendingPokemon),
    addPendingPokemon,
    removePendingPokemon,
    clearAllPending,
    isPokemonPending,
    getAllPendingIds,
    blockSync,
    hasPendingPokemon: pendingPokemon.size > 0
  };
};
