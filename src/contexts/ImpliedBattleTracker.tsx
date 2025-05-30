import React, { createContext, useContext, useState, useCallback } from 'react';

interface ImpliedBattle {
  id: string;
  draggedPokemon: string;
  opponent: string;
  winner: string;
  battleType: string;
  timestamp: string;
}

interface ImpliedBattleContextType {
  impliedBattles: ImpliedBattle[];
  addImpliedBattle: (battle: Omit<ImpliedBattle, 'id' | 'timestamp'>) => void;
  clearImpliedBattles: () => void;
}

const ImpliedBattleContext = createContext<ImpliedBattleContextType | undefined>(undefined);

export const ImpliedBattleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [impliedBattles, setImpliedBattles] = useState<ImpliedBattle[]>([]);

  const addImpliedBattle = useCallback((battle: Omit<ImpliedBattle, 'id' | 'timestamp'>) => {
    const newBattle: ImpliedBattle = {
      ...battle,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString()
    };

    setImpliedBattles(prev => {
      const updated = [...prev, newBattle];
      // Keep only last 10 battles
      return updated.slice(-10);
    });
  }, []);

  const clearImpliedBattles = useCallback(() => {
    setImpliedBattles([]);
  }, []);

  return (
    <ImpliedBattleContext.Provider value={{
      impliedBattles,
      addImpliedBattle,
      clearImpliedBattles
    }}>
      {children}
    </ImpliedBattleContext.Provider>
  );
};

export const useImpliedBattleTracker = () => {
  const context = useContext(ImpliedBattleContext);
  if (!context) {
    throw new Error('useImpliedBattleTracker must be used within ImpliedBattleProvider');
  }
  return context;
};
