
import { useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface InitialSessionProps {
  mountedRef: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializationCompleteRef: React.MutableRefObject<boolean>;
  lastEventRef: React.MutableRefObject<string>;
  hookInstanceRef: React.MutableRefObject<string>;
}

export const useInitialSession = ({
  mountedRef,
  setSession,
  setUser,
  setLoading,
  initializationCompleteRef,
  lastEventRef,
  hookInstanceRef
}: InitialSessionProps) => {
  
  useEffect(() => {
    const getInitialSession = async () => {
      console.log('[INITIAL_SESSION] Getting initial session');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[INITIAL_SESSION] Initial session error:', error);
        }
        
        if (!mountedRef.current) {
          console.log('[INITIAL_SESSION] Component unmounted during session fetch');
          return;
        }
        
        const initialUser = session?.user ?? null;
        
        setSession(session);
        setUser(initialUser);
        setLoading(false);
        initializationCompleteRef.current = true;
        lastEventRef.current = 'INITIAL_SESSION';
        
        console.log('[INITIAL_SESSION] Initial session complete:', !!session);
        
      } catch (err) {
        console.error('[INITIAL_SESSION] Exception in initial session check:', err);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
          initializationCompleteRef.current = true;
          lastEventRef.current = 'INITIAL_ERROR';
        }
      }
    };

    getInitialSession();
  }, [mountedRef, setSession, setUser, setLoading, initializationCompleteRef, lastEventRef, hookInstanceRef]);
};
