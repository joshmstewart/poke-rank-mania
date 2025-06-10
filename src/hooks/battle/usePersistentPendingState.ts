
import { useState, useCallback, useEffect, useRef } from 'react';

// Use a separate localStorage key that won't be touched by cloud sync
const PENDING_STATE_KEY = 'pokemon-refinement-queue-pending';

// CRITICAL FIX: Create a singleton state manager to ensure all components share the same data
class PendingStateManager {
  private static instance: PendingStateManager;
  private pendingSet: Set<number> = new Set();
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;

  public static getInstance(): PendingStateManager {
    if (!PendingStateManager.instance) {
      PendingStateManager.instance = new PendingStateManager();
    }
    return PendingStateManager.instance;
  }

  private constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      console.log(`🔍 [SINGLETON_DEBUG] Loading from localStorage key: ${PENDING_STATE_KEY}`);
      const stored = localStorage.getItem(PENDING_STATE_KEY);
      console.log(`🔍 [SINGLETON_DEBUG] Raw localStorage value:`, stored);
      
      if (stored) {
        const pokemonIds = JSON.parse(stored);
        this.pendingSet = new Set<number>(pokemonIds);
        console.log(`🔍 [SINGLETON_DEBUG] ✅ Loaded ${this.pendingSet.size} pending Pokemon:`, Array.from(this.pendingSet));
      } else {
        console.log(`🔍 [SINGLETON_DEBUG] No stored data found`);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error(`🔍 [SINGLETON_DEBUG] ❌ Error loading pending state:`, error);
      this.isInitialized = true;
    }
  }

  private saveToStorage() {
    try {
      const pokemonIds = Array.from(this.pendingSet);
      const jsonString = JSON.stringify(pokemonIds);
      localStorage.setItem(PENDING_STATE_KEY, jsonString);
      
      console.log(`🔍 [SINGLETON_DEBUG] ✅ SAVED to localStorage:`, {
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
      console.error(`🔍 [SINGLETON_DEBUG] ❌ Error saving pending state:`, error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  public addListener(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public addPokemon(pokemonId: number) {
    console.log(`🔍 [SINGLETON_DEBUG] ===== ADDING POKEMON ${pokemonId} =====`);
    console.log(`🔍 [SINGLETON_DEBUG] Timestamp: ${new Date().toISOString()}`);
    console.log(`🔍 [SINGLETON_DEBUG] Current pending before add:`, Array.from(this.pendingSet));
    
    const wasAlreadyPending = this.pendingSet.has(pokemonId);
    this.pendingSet.add(pokemonId);
    
    console.log(`🔍 [SINGLETON_DEBUG] Was already pending: ${wasAlreadyPending}`);
    console.log(`🔍 [SINGLETON_DEBUG] New set size: ${this.pendingSet.size}`);
    console.log(`🔍 [SINGLETON_DEBUG] New set contents:`, Array.from(this.pendingSet));
    
    this.saveToStorage();
    this.notifyListeners();
  }

  public removePokemon(pokemonId: number) {
    console.log(`🔍 [SINGLETON_DEBUG] ===== REMOVING POKEMON ${pokemonId} =====`);
    
    const wasRemoved = this.pendingSet.delete(pokemonId);
    
    console.log(`🔍 [SINGLETON_DEBUG] Was removed: ${wasRemoved}`);
    console.log(`🔍 [SINGLETON_DEBUG] New set size: ${this.pendingSet.size}`);
    
    this.saveToStorage();
    localStorage.removeItem(`pokemon-pending-${pokemonId}`);
    this.notifyListeners();
  }

  public clearAll() {
    console.log(`🔍 [SINGLETON_DEBUG] ===== CLEARING ALL PENDING =====`);
    console.log(`🔍 [SINGLETON_DEBUG] Current pending:`, Array.from(this.pendingSet));
    
    // Clear individual keys
    this.pendingSet.forEach(id => {
      localStorage.removeItem(`pokemon-pending-${id}`);
    });
    
    // Clear main storage
    localStorage.removeItem(PENDING_STATE_KEY);
    this.pendingSet.clear();
    
    this.saveToStorage();
    this.notifyListeners();
    console.log(`🔍 [SINGLETON_DEBUG] ✅ All pending Pokemon cleared`);
  }

  public isPending(pokemonId: number): boolean {
    const isPending = this.pendingSet.has(pokemonId);
    console.log(`🔍 [SINGLETON_DEBUG] Check pending for ${pokemonId}: ${isPending}`);
    return isPending;
  }

  public getAllIds(): number[] {
    const ids = Array.from(this.pendingSet);
    console.log(`🔍 [SINGLETON_DEBUG] ===== GET ALL PENDING IDS =====`);
    console.log(`🔍 [SINGLETON_DEBUG] Returning:`, ids);
    console.log(`🔍 [SINGLETON_DEBUG] Set size:`, this.pendingSet.size);
    console.log(`🔍 [SINGLETON_DEBUG] hasPendingPokemon:`, this.pendingSet.size > 0);
    return ids;
  }

  public get hasPending(): boolean {
    return this.pendingSet.size > 0;
  }

  public get count(): number {
    return this.pendingSet.size;
  }
}

export const usePersistentPendingState = () => {
  const manager = PendingStateManager.getInstance();
  const [, forceUpdate] = useState({});
  
  console.log(`🔍 [SINGLETON_DEBUG] Hook initialized - using singleton manager`);

  // Subscribe to manager updates
  useEffect(() => {
    const unsubscribe = manager.addListener(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [manager]);

  // Wrap manager methods
  const addPendingPokemon = useCallback((pokemonId: number) => {
    manager.addPokemon(pokemonId);
  }, [manager]);

  const removePendingPokemon = useCallback((pokemonId: number) => {
    manager.removePokemon(pokemonId);
  }, [manager]);

  const clearAllPending = useCallback(() => {
    manager.clearAll();
  }, [manager]);

  const isPokemonPending = useCallback((pokemonId: number): boolean => {
    return manager.isPending(pokemonId);
  }, [manager]);

  const getAllPendingIds = useCallback((): number[] => {
    return manager.getAllIds();
  }, [manager]);

  const blockSync = useCallback(() => {
    console.log(`🔍 [SINGLETON_DEBUG] ⏸️ Sync blocked (no-op in singleton)`);
  }, []);

  console.log(`🔍 [SINGLETON_DEBUG] Hook render - current state:`, {
    pendingCount: manager.count,
    pendingIds: manager.getAllIds(),
    hasPendingPokemon: manager.hasPending
  });

  return {
    pendingPokemon: manager.getAllIds(),
    addPendingPokemon,
    removePendingPokemon,
    clearAllPending,
    isPokemonPending,
    getAllPendingIds,
    blockSync,
    hasPendingPokemon: manager.hasPending
  };
};
