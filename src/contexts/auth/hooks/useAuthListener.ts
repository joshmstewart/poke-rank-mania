
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthListenerProps {
  handleAuthStateChange: (event: any, session: any) => void;
  authListenerRef: React.MutableRefObject<any>;
  mountedRef: React.MutableRefObject<boolean>;
}

export const useAuthListener = ({
  handleAuthStateChange,
  authListenerRef,
  mountedRef
}: AuthListenerProps) => {
  
  useEffect(() => {
    mountedRef.current = true;
    
    if (authListenerRef.current) {
      authListenerRef.current.unsubscribe();
      authListenerRef.current = null;
    }
    
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
      authListenerRef.current = subscription;
    } catch (error) {
      console.error('Failed to create auth listener:', error);
    }

    return () => {
      mountedRef.current = false;
      
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [handleAuthStateChange, authListenerRef, mountedRef]);
};
