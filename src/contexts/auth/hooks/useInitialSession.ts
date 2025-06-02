
import { useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useTrueSkillStore } from '@/stores/trueskillStore';

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
      console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] ===== GET INITIAL SESSION =====');
      
      // CRITICAL DEBUG: Check TrueSkill sessionId at the very start
      const initialTrueSkillSessionId = useTrueSkillStore.getState().sessionId;
      const initialIsHydrated = useTrueSkillStore.getState().isHydrated;
      console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] VERY START - TrueSkill sessionId:', initialTrueSkillSessionId);
      console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] VERY START - TrueSkill isHydrated:', initialIsHydrated);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] Got session from Supabase');
        console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] Session exists:', !!session);
        console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] User ID:', session?.user?.id?.substring(0, 8) || 'NONE');
        
        if (error) {
          console.error('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] Initial session error:', error);
        }
        
        if (!mountedRef.current) {
          console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] Component unmounted during session fetch');
          return;
        }
        
        const initialUser = session?.user ?? null;
        
        // CRITICAL DEBUG: Check TrueSkill sessionId BEFORE setting auth state
        const beforeAuthTrueSkillSessionId = useTrueSkillStore.getState().sessionId;
        console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] BEFORE AUTH UPDATE - TrueSkill sessionId:', beforeAuthTrueSkillSessionId);
        
        setSession(session);
        setUser(initialUser);
        setLoading(false);
        initializationCompleteRef.current = true;
        lastEventRef.current = 'INITIAL_SESSION';
        
        // CRITICAL DEBUG: Check TrueSkill sessionId AFTER setting auth state
        const afterAuthTrueSkillSessionId = useTrueSkillStore.getState().sessionId;
        console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] AFTER AUTH UPDATE - TrueSkill sessionId:', afterAuthTrueSkillSessionId);
        
        // CRITICAL DEBUG: If we have a user, check their profile for correct sessionId
        if (initialUser?.id) {
          console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] User exists - checking profile for sessionId');
          
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('trueskill_session_id')
              .eq('id', initialUser.id)
              .maybeSingle();
              
            if (profileError) {
              console.error('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] Profile fetch error:', profileError);
            } else if (profile?.trueskill_session_id) {
              console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] ⚠️ Profile sessionId:', profile.trueskill_session_id);
              console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] ⚠️ Current TrueSkill sessionId:', afterAuthTrueSkillSessionId);
              
              if (profile.trueskill_session_id !== afterAuthTrueSkillSessionId) {
                console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] 🚨 MISMATCH IN INITIAL SESSION! 🚨');
                console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] 🚨 This might be the root cause!');
                
                // Force correction here
                const { forceCorrectSession } = useTrueSkillStore.getState();
                console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] 🚨 FORCING CORRECTION FROM INITIAL SESSION');
                await forceCorrectSession(initialUser.id);
                
                const correctedSessionId = useTrueSkillStore.getState().sessionId;
                console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] ✅ Corrected sessionId:', correctedSessionId);
              } else {
                console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] ✅ SessionIds match - no correction needed');
              }
            } else {
              console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] No profile sessionId found');
            }
          } catch (profileError) {
            console.error('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] Exception checking profile:', profileError);
          }
        }
        
        console.log('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] ===== INITIAL SESSION COMPLETE =====');
        
      } catch (err) {
        console.error('🚀🚀🚀 [INITIAL_SESSION_INVESTIGATION] Exception in initial session check:', err);
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
