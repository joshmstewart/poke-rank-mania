import { useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    
    setSession(session);
    setLoading(false);
    initializationCompleteRef.current = true;
    
    if (session) {
      if (session.user) {
        console.log('[AUTH_STATE_HANDLER] ✅ Found user in session object.');
        setUser(session.user);
      } else {
        console.warn('[AUTH_STATE_HANDLER] ⚠️ User object missing from session. Attempting to fetch user manually.');
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('[AUTH_STATE_HANDLER] ❌ Error fetching user manually:', error);
          setUser(null);
        } else if (user) {
          console.log('[AUTH_STATE_HANDLER] ✅ Manually fetched user successfully.');
          setUser(user);
        } else {
          console.warn('[AUTH_STATE_HANDLER] ⚠️ Manual user fetch returned null.');
          setUser(null);
        }
      }
    } else {
      console.log('[AUTH_STATE_HANDLER] No session found. Clearing user.');
      setUser(null);
    }
    
  }, [mountedRef, lastEventRef, setSession, setUser, setLoading, initializationCompleteRef]);

  return { handleAuthStateChange };
};
