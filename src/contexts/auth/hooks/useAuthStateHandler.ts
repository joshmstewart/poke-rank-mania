
import { useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';

interface AuthStateHandlerProps {
  mountedRef: React.MutableRefObject<boolean>;
  lastEventRef: React.MutableRefObject<string>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializationCompleteRef: React.MutableRefObject<boolean>;
}

export const useAuthStateHandler = ({
  mountedRef,
  lastEventRef,
  setSession,
  setUser,
  setLoading,
  initializationCompleteRef
}: AuthStateHandlerProps) => {
  
  const handleAuthStateChange = useCallback((event: any, session: Session | null) => {
    if (!mountedRef.current) {
      return;
    }

    lastEventRef.current = event;
    
    try {
      setSession(session);
      
      const userToSet = session?.user ?? null;
      setUser(userToSet);
      
      setLoading(false);
      initializationCompleteRef.current = true;
      
    } catch (error) {
      console.error('Error in auth state update:', error);
    }
  }, [mountedRef, lastEventRef, setSession, setUser, setLoading, initializationCompleteRef]);

  return { handleAuthStateChange };
};
