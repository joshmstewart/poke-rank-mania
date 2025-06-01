
import { useAuthStateManager } from './hooks/useAuthStateManager';
import { useAuthStateHandler } from './hooks/useAuthStateHandler';
import { useInitialSession } from './hooks/useInitialSession';
import { useAuthListener } from './hooks/useAuthListener';

export const useAuthState = () => {
  const {
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    mountedRef,
    authListenerRef,
    hookInstanceRef,
    initializationCompleteRef,
    lastEventRef
  } = useAuthStateManager();

  const { handleAuthStateChange } = useAuthStateHandler({
    mountedRef,
    lastEventRef,
    setSession,
    setUser,
    setLoading,
    initializationCompleteRef
  });

  useAuthListener({
    handleAuthStateChange,
    authListenerRef,
    mountedRef
  });

  useInitialSession({
    mountedRef,
    setSession,
    setUser,
    setLoading,
    initializationCompleteRef,
    lastEventRef,
    hookInstanceRef
  });

  return { user, session, loading };
};
