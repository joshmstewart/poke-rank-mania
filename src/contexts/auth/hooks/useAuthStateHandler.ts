
import { useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useTrueSkillStore } from '@/stores/trueskillStore';

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
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] ===== AUTH STATE CHANGE =====');
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] Event:', event);
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] Session exists:', !!session);
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] User ID:', session?.user?.id?.substring(0, 8) || 'NONE');
    
    // CRITICAL DEBUG: Check TrueSkill sessionId BEFORE any changes
    const currentTrueSkillSessionId = useTrueSkillStore.getState().sessionId;
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] BEFORE - TrueSkill sessionId:', currentTrueSkillSessionId);
    
    if (!mountedRef.current) {
      console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] Component unmounted - ignoring event');
      return;
    }

    if (lastEventRef.current === event && event !== 'TOKEN_REFRESHED') {
      console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] Duplicate event - ignoring');
      return;
    }

    lastEventRef.current = event;
    
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] Processing auth state change...');
    
    // Update auth state
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
    initializationCompleteRef.current = true;
    
    // CRITICAL DEBUG: Check TrueSkill sessionId AFTER auth state update
    const afterAuthTrueSkillSessionId = useTrueSkillStore.getState().sessionId;
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] AFTER AUTH - TrueSkill sessionId:', afterAuthTrueSkillSessionId);
    
    // CRITICAL DEBUG: If user is authenticated, check what happens to sessionId
    if (session?.user?.id) {
      console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] User authenticated - checking profile for correct sessionId');
      
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('trueskill_session_id')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (profile?.trueskill_session_id) {
          console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] ⚠️ Profile has sessionId:', profile.trueskill_session_id);
          console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] ⚠️ Current TrueSkill sessionId:', afterAuthTrueSkillSessionId);
          
          if (profile.trueskill_session_id !== afterAuthTrueSkillSessionId) {
            console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] 🚨 SESSION MISMATCH DETECTED IN AUTH HANDLER! 🚨');
            console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] 🚨 Profile says:', profile.trueskill_session_id);
            console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] 🚨 TrueSkill store says:', afterAuthTrueSkillSessionId);
            
            // This might be where the problem occurs - let's see if something else is setting the wrong sessionId
            console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] 🚨 TRIGGERING FORCE CORRECTION FROM AUTH HANDLER');
            
            const { forceCorrectSession } = useTrueSkillStore.getState();
            await forceCorrectSession(session.user.id);
            
            const finalSessionId = useTrueSkillStore.getState().sessionId;
            console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] Final sessionId after force correction:', finalSessionId);
          }
        }
      } catch (error) {
        console.error('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] Error checking profile:', error);
      }
    }
    
    console.log('🔥🔥🔥 [AUTH_STATE_HANDLER_INVESTIGATION] ===== AUTH STATE CHANGE COMPLETE =====');
    
  }, [mountedRef, lastEventRef, setSession, setUser, setLoading, initializationCompleteRef]);

  return { handleAuthStateChange };
};
