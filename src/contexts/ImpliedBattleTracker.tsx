import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ImpliedBattleRecord {
  id: string;
  timestamp: number;
  draggedPokemon: string;
  opponent: string;
  winner: string;
  battleType: string;
  sequence: number;
}

interface ImpliedBattleTrackerContextType {
  impliedBattleRecords: ImpliedBattleRecord[];
  addImpliedBattle: (
    draggedPokemon: string,
    opponent: string,
    winner: string,
    battleType: string
  ) => void;
  clearRecords: () => void;
}

const ImpliedBattleTrackerContext = createContext<ImpliedBattleTrackerContextType | null>(null);

export const useImpliedBattleTracker = () => {
  const context = useContext(ImpliedBattleTrackerContext);
  if (!context) {
    throw new Error('useImpliedBattleTracker must be used within ImpliedBattleTrackerProvider');
  }
  return context;
};

interface ImpliedBattleTrackerProviderProps {
  children: ReactNode;
}

export const ImpliedBattleTrackerProvider: React.FC<ImpliedBattleTrackerProviderProps> = ({ children }) => {
  const [impliedBattleRecords, setImpliedBattleRecords] = useState<ImpliedBattleRecord[]>([]);
  const [sequenceCounter, setSequenceCounter] = useState(1);

  const addImpliedBattle = useCallback((
    draggedPokemon: string,
    opponent: string,
    winner: string,
    battleType: string
  ) => {
    const newRecord: ImpliedBattleRecord = {
      id: `implied-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      draggedPokemon,
      opponent,
      winner,
      battleType,
      sequence: sequenceCounter
    };

    setSequenceCounter(prev => prev + 1);
    
    setImpliedBattleRecords(prev => {
      const updated = [newRecord, ...prev];
      // Keep only the last 5 records
      return updated.slice(0, 5);
    });

    console.log(`📊 [IMPLIED_BATTLE_TRACKER] Added record: ${winner} defeated ${winner === draggedPokemon ? opponent : draggedPokemon} (${battleType})`);
  }, [sequenceCounter]);

  const clearRecords = useCallback(() => {
    setImpliedBattleRecords([]);
    setSequenceCounter(1);
    console.log(`📊 [IMPLIED_BATTLE_TRACKER] Cleared all records`);
  }, []);

  return (
    <ImpliedBattleTrackerContext.Provider value={{
      impliedBattleRecords,
      addImpliedBattle,
      clearRecords
    }}>
      {children}
    </ImpliedBattleTrackerContext.Provider>
  );
};
