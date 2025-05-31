import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ImpliedBattle {
  id: string;
  timestamp: string;
  draggedPokemon: string;
  opponent: string;
  winner: string;
  battleType: string;
  sequence: number;
}

interface ImpliedBattleTrackerContextType {
  impliedBattles: ImpliedBattle[];
  addImpliedBattle: (battle: Omit<ImpliedBattle, 'id' | 'timestamp' | 'sequence'>) => void;
  clearImpliedBattles: () => void;
}

const ImpliedBattleTrackerContext = createContext<ImpliedBattleTrackerContextType | undefined>(undefined);

let sequenceCounter = 0;

export const ImpliedBattleTrackerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [impliedBattles, setImpliedBattles] = useState<ImpliedBattle[]>([]);

  const addImpliedBattle = (battle: Omit<ImpliedBattle, 'id' | 'timestamp' | 'sequence'>) => {
    const newBattle: ImpliedBattle = {
      ...battle,
      id: `implied-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      sequence: ++sequenceCounter
    };

    setImpliedBattles(prev => {
      const updated = [newBattle, ...prev];
      // Keep only the last 10 records
      return updated.slice(0, 10);
    });
  };

  const clearImpliedBattles = () => {
    setImpliedBattles([]);
    sequenceCounter = 0;
  };

  return (
    <ImpliedBattleTrackerContext.Provider value={{
      impliedBattles,
      addImpliedBattle,
      clearImpliedBattles
    }}>
      {children}
    </ImpliedBattleTrackerContext.Provider>
  );
};

export const useImpliedBattleTracker = () => {
  const context = useContext(ImpliedBattleTrackerContext);
  if (context === undefined) {
    throw new Error('useImpliedBattleTracker must be used within an ImpliedBattleTrackerProvider');
  }
  return context;
};
