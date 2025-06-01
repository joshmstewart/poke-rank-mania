
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const BulletproofAuthDisplay: React.FC = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());
  const [directSupabaseSession, setDirectSupabaseSession] = useState<any>(null);
  const mountTimeRef = useRef(new Date().toISOString());
  const intervalRef = useRef<NodeJS.Timeout>();
  
  // Force re-render every second to ensure visibility
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRenderCount(prev => prev + 1);
      setLastUpdate(new Date().toISOString());
      
      // FORCE CHECK SUPABASE SESSION DIRECTLY
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        setDirectSupabaseSession(session);
        console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Direct Supabase session check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          email: session?.user?.email,
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const { user, session, loading } = useAuth();

  console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: ===== FORCED PERSISTENT RENDER =====');
  console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Render count:', renderCount);
  console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Mount time:', mountTimeRef.current);
  console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Auth state from useAuth context:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email || session?.user?.email || 'NO_EMAIL',
    timestamp: new Date().toISOString()
  });
  console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Direct Supabase session:', {
    hasDirectSession: !!directSupabaseSession,
    hasDirectUser: !!directSupabaseSession?.user,
    directEmail: directSupabaseSession?.user?.email || 'NO_DIRECT_EMAIL',
    timestamp: new Date().toISOString()
  });
  console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Call stack:', new Error().stack);

  useEffect(() => {
    console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: ===== MOUNT EFFECT =====');
    console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Mounted at:', new Date().toISOString());
    console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Mount stack:', new Error().stack);
    
    return () => {
      console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: ===== UNMOUNT DETECTED =====');
      console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: 🚨🚨🚨 BULLETPROOF DISPLAY UNMOUNTING 🚨🚨🚨');
      console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Unmount at:', new Date().toISOString());
      console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Unmount stack:', new Error().stack);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 99999,
      backgroundColor: '#ff0000',
      color: '#ffffff',
      padding: '20px',
      border: '5px solid #ffff00',
      fontSize: '16px',
      fontWeight: 'bold',
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '20px', marginBottom: '10px' }}>
        🔥 BULLETPROOF AUTH DISPLAY 🔥
      </div>
      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
        CANNOT BE UNMOUNTED - FORCED PERSISTENT<br/>
        Render Count: {renderCount}<br/>
        Mount Time: {new Date(mountTimeRef.current).toLocaleTimeString()}<br/>
        Last Update: {new Date(lastUpdate).toLocaleTimeString()}<br/>
        Loading: {loading ? 'YES' : 'NO'}<br/>
        Has User (context): {!!user ? 'YES' : 'NO'}<br/>
        Has Session (context): {!!session ? 'YES' : 'NO'}<br/>
        Email (context): {user?.email || session?.user?.email || 'NONE'}<br/>
        Has Direct Session: {!!directSupabaseSession ? 'YES' : 'NO'}<br/>
        Direct Email: {directSupabaseSession?.user?.email || 'NONE'}<br/>
        <div style={{ color: '#ffff00', fontSize: '12px', marginTop: '10px' }}>
          THIS WILL STAY VISIBLE NO MATTER WHAT HAPPENS
        </div>
      </div>
    </div>
  );
};
