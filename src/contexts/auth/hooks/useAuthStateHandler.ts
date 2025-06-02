
import { useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

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

  const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    console.log('[AUTH_STATE_HANDLER] Auth state change:', event, !!session);
    
    if (!mountedRef.current) {
      console.log('[AUTH_STATE_HANDLER] Component unmounted - ignoring event');
      return;
    }

    if (lastEventRef.current === event && event !== 'TOKEN_REFRESHED') {
      console.log('[AUTH_STATE_HANDLER] Duplicate event - ignoring');
      return;
    }

    lastEventRef.current = event;
    
    // Update auth state
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
    initializationCompleteRef.current = true;
    
  }, [mountedRef, lastEventRef, setSession, setUser, setLoading, initializationCompleteRef]);

  return { handleAuthStateChange };
};
