
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAuthenticatedUser = (currentUser?: any) => {
  const { user, session } = useAuth();
  const [directSupabaseUser, setDirectSupabaseUser] = useState<any>(null);
  const [renderCount, setRenderCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const lastLogTime = useRef(0);

  // Increment render count on each render
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // Initialize component
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== COMPONENT INITIALIZED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Component mounted and initialized');
    }
  }, [initialized]);

  // Throttled logging to reduce console spam
  useEffect(() => {
    const now = Date.now();
    // Only log every 5 seconds to reduce spam
    if (now - lastLogTime.current > 5000) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Render #' + renderCount);
      if (renderCount > 1000) {
        console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ⚠️ HIGH RENDER COUNT - investigating cause');
      }
      lastLogTime.current = now;
    }
  }, [renderCount]);

  // Get direct Supabase user for comparison - STABILIZED with useCallback
  const checkDirectSupabaseUser = useCallback(async () => {
    try {
      const { data: { user: directUser }, error } = await supabase.auth.getUser();
      setDirectSupabaseUser(directUser);
      if (renderCount <= 5) {
        console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Direct Supabase user check:', {
          hasDirectUser: !!directUser,
          directEmail: directUser?.email || null,
          directPhone: directUser?.phone || null,
          directId: directUser?.id || null,
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Error checking direct user:', error);
    }
  }, [renderCount]);

  useEffect(() => {
    if (initialized) {
      checkDirectSupabaseUser();
    }
  }, [initialized, checkDirectSupabaseUser]);

  // Log auth context state on changes
  useEffect(() => {
    const now = Date.now();
    if (now - lastLogTime.current > 3000) { // Log auth context changes every 3 seconds max
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== CONTEXT STATE CHECK =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Auth context state:', {
        hasUser: !!user,
        hasSession: !!session,
        userEmail: user?.email || null,
        userPhone: user?.phone || null,
        userId: user?.id || null,
        sessionUserEmail: session?.user?.email || null,
        sessionUserPhone: session?.user?.phone || null,
        sessionUserId: session?.user?.id || null,
        contextWorking: (!!user || !!session?.user) ? 'YES_CONTEXT_WORKING' : 'NO_CONTEXT_BROKEN',
        timestamp: new Date().toISOString()
      });
      lastLogTime.current = now;
    }
  }, [user, session, renderCount]);

  // STABILIZED: Use current user from props, context, or direct Supabase check
  const effectiveUser = useMemo(() => {
    return currentUser || user || session?.user || directSupabaseUser;
  }, [currentUser, user, session?.user, directSupabaseUser]);

  // Mount/unmount tracking
  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== MOUNT EFFECT =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Component mounted successfully');
    
    return () => {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== UNMOUNT DETECTED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🚨🚨🚨 AuthenticatedUserDisplay UNMOUNTING 🚨🚨🚨');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Final render count was:', renderCount);
    };
  }, []);

  return {
    effectiveUser,
    renderCount,
    lastLogTime
  };
};
