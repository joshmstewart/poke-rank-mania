
import { useState, useCallback, useEffect, useRef } from 'react';

// Use a separate localStorage key that won't be touched by cloud sync
const PENDING_STATE_KEY = 'pokemon-refinement-queue-pending';
const PENDING_EVENT_KEY = 'pokemon-refinement-queue-events';

export const usePersistentPendingState = () => {
  const [pendingPokemon, setPendingPokemon] = useState<Set<number>>(new Set());
  const syncBlockRef = useRef(false);
  
  console.log(`🔍 [PENDING_DEBUG] Hook initialized - timestamp: ${Date.now()}`);

  // Load pending state on initialization
  useEffect(() => {
    const loadPendingState = () => {
      try {
        console.log(`🔍 [PENDING_DEBUG] Loading from localStorage key: ${PENDING_STATE_KEY}`);
        const stored = localStorage.getItem(PENDING_STATE_KEY);
        console.log(`🔍 [PENDING_DEBUG] Raw localStorage value:`, stored);
        
        if (stored) {
          const pokemonIds = JSON.parse(stored);
          const pendingSet = new Set<number>(pokemonIds);
          setPendingPokemon(pendingSet);
          console.log(`🔍 [PENDING_DEBUG] ✅ Loaded ${pendingSet.size} pending Pokemon:`, Array.from(pendingSet));
        } else {
          console.log(`🔍 [PENDING_DEBUG] No stored data found`);
        }
      } catch (error) {
        console.error(`🔍 [PENDING_DEBUG] ❌ Error loading pending state:`, error);
      }
    };

    loadPendingState();
  }, []);

  // Save pending state to localStorage
  const savePendingState = useCallback((newPendingSet: Set<number>) => {
    if (syncBlockRef.current) {
      console.log(`🔍 [PENDING_DEBUG] ⏸️ Save blocked during sync operation`);
      return;
    }
    
    try {
      const pokemonIds = Array.from(newPendingSet);
      const jsonString = JSON.stringify(pokemonIds);
      localStorage.setItem(PENDING_STATE_KEY, jsonString);
      
      console.log(`🔍 [PENDING_DEBUG] ✅ SAVED to localStorage:`, {
        key: PENDING_STATE_KEY,
        value: jsonString,
        pokemonIds: pokemonIds,
        count: pokemonIds.length
      });
      
      // Also store individual keys for backwards compatibility
      pokemonIds.forEach(id => {
        localStorage.setItem(`pokemon-pending-${id}`, 'true');
      });
      
    } catch (error) {
      console.error(`🔍 [PENDING_DEBUG] ❌ Error saving pending state:`, error);
    }
  }, []);

  // Add Pokemon to pending state
  const addPendingPokemon = useCallback((pokemonId: number) => {
    console.log(`🔍 [PENDING_DEBUG] ===== ADDING POKEMON ${pokemonId} =====`);
    console.log(`🔍 [PENDING_DEBUG] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔍 [PENDING_DEBUG] Current pending before add:`, Array.from(pendingPokemon));
    
    setPendingPokemon(prev => {
      const newSet = new Set(prev);
      const wasAlreadyPending = newSet.has(pokemonId);
      newSet.add(pokemonId);
      
      console.log(`🔍 [PENDING_DEBUG] Was already pending: ${wasAlreadyPending}`);
      console.log(`🔍 [PENDING_DEBUG] New set size: ${newSet.size}`);
      console.log(`🔍 [PENDING_DEBUG] New set contents:`, Array.from(newSet));
      
      // Save immediately
      setTimeout(() => {
        savePendingState(newSet);
      }, 0);
      
      return newSet;
    });
  }, [savePendingState, pendingPokemon]);

  // Remove Pokemon from pending state
  const removePendingPokemon = useCallback((pokemonId: number) => {
    console.log(`🔍 [PENDING_DEBUG] ===== REMOVING POKEMON ${pokemonId} =====`);
    
    setPendingPokemon(prev => {
      const newSet = new Set(prev);
      const wasRemoved = newSet.delete(pokemonId);
      
      console.log(`🔍 [PENDING_DEBUG] Was removed: ${wasRemoved}`);
      console.log(`🔍 [PENDING_DEBUG] New set size: ${newSet.size}`);
      
      // Save immediately and clean up individual keys
      setTimeout(() => {
        savePendingState(newSet);
        localStorage.removeItem(`pokemon-pending-${pokemonId}`);
      }, 0);
      
      return newSet;
    });
  }, [savePendingState]);

  // Clear all pending Pokemon
  const clearAllPending = useCallback(() => {
    console.log(`🔍 [PENDING_DEBUG] ===== CLEARING ALL PENDING =====`);
    console.log(`🔍 [PENDING_DEBUG] Current pending:`, Array.from(pendingPokemon));
    
    // Clear individual keys
    pendingPokemon.forEach(id => {
      localStorage.removeItem(`pokemon-pending-${id}`);
    });
    
    // Clear main storage
    localStorage.removeItem(PENDING_STATE_KEY);
    
    setPendingPokemon(new Set());
    console.log(`🔍 [PENDING_DEBUG] ✅ All pending Pokemon cleared`);
  }, [pendingPokemon]);

  // Check if Pokemon is pending
  const isPokemonPending = useCallback((pokemonId: number): boolean => {
    const isPending = pendingPokemon.has(pokemonId);
    console.log(`🔍 [PENDING_DEBUG] Check pending for ${pokemonId}: ${isPending}`);
    return isPending;
  }, [pendingPokemon]);

  // Get all pending Pokemon IDs
  const getAllPendingIds = useCallback((): number[] => {
    const ids = Array.from(pendingPokemon);
    console.log(`🔍 [PENDING_DEBUG] ===== GET ALL PENDING IDS =====`);
    console.log(`🔍 [PENDING_DEBUG] Returning:`, ids);
    console.log(`🔍 [PENDING_DEBUG] Set size:`, pendingPokemon.size);
    console.log(`🔍 [PENDING_DEBUG] hasPendingPokemon:`, pendingPokemon.size > 0);
    return ids;
  }, [pendingPokemon]);

  // Block sync during cloud operations
  const blockSync = useCallback(() => {
    syncBlockRef.current = true;
    console.log(`🔍 [PENDING_DEBUG] ⏸️ Sync blocked`);
    
    // Auto-unblock after 5 seconds
    setTimeout(() => {
      syncBlockRef.current = false;
      console.log(`🔍 [PENDING_DEBUG] ✅ Sync unblocked`);
    }, 5000);
  }, []);

  console.log(`🔍 [PENDING_DEBUG] Hook render - current state:`, {
    pendingCount: pendingPokemon.size,
    pendingIds: Array.from(pendingPokemon),
    hasPendingPokemon: pendingPokemon.size > 0
  });

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
