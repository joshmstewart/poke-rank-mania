
import { useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';

export const useAuthStateManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const mountedRef = useRef(true);
  const authListenerRef = useRef<any>(null);
  const hookInstanceRef = useRef('auth-state-hook-manager');
  const initializationCompleteRef = useRef(false);
  const lastEventRef = useRef('NONE');

  return {
    // State
    user,
    session,
    loading,
    setUser,
    setSession,
    setLoading,
    
    // Refs
    mountedRef,
    authListenerRef,
    hookInstanceRef,
    initializationCompleteRef,
    lastEventRef
  };
};
