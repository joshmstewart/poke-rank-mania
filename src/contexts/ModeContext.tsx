import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ModeContextType {
  mode: 'rank' | 'battle';
  setMode: (mode: 'rank' | 'battle') => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useLocalStorage<'rank' | 'battle'>(
    'pokemon-ranker-mode',
    'rank'
  );

  const value = React.useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};
