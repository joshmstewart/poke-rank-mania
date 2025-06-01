
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const BulletproofAuthDisplay: React.FC = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());
  const mountTimeRef = useRef(new Date().toISOString());
  const intervalRef = useRef<NodeJS.Timeout>();
  
  // Force re-render every second to ensure visibility
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRenderCount(prev => prev + 1);
      setLastUpdate(new Date().toISOString());
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
  console.log('🔥🔥🔥 BULLETPROOF_AUTH_DISPLAY: Auth state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userEmail: user?.email || session?.user?.email || 'NO_EMAIL',
    timestamp: new Date().toISOString()
  });

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
        Has User: {!!user ? 'YES' : 'NO'}<br/>
        Has Session: {!!session ? 'YES' : 'NO'}<br/>
        Email: {user?.email || session?.user?.email || 'NONE'}<br/>
        <div style={{ color: '#ffff00', fontSize: '12px', marginTop: '10px' }}>
          THIS WILL STAY VISIBLE NO MATTER WHAT HAPPENS
        </div>
      </div>
    </div>
  );
};
