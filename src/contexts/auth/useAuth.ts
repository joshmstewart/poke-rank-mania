
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('🔴🔴🔴 [USE_AUTH_ULTIMATE] ❌ useAuth called outside AuthProvider!');
    console.error('🔴🔴🔴 [USE_AUTH_ULTIMATE] Call stack:', new Error().stack);
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] ===== useAuth CALLED =====');
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Context received from AuthProvider:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email,
    sessionUserEmail: context.session?.user?.email,
    userId: context.user?.id,
    sessionUserId: context.session?.user?.id,
    timestamp: new Date().toISOString()
  });
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Call stack:', new Error().stack);
  
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] 🎯 RETURNING TO CONSUMER 🎯');
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Consumer will receive:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email,
    functions: 'signIn, signOut, etc.'
  });
  
  if (context.user || context.session?.user) {
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] ✅ AUTHENTICATED CONTEXT BEING RETURNED ✅');
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Auth components should now render authenticated UI');
  } else if (context.loading) {
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] ⏳ LOADING CONTEXT BEING RETURNED ⏳');
  } else {
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] ❌ UNAUTHENTICATED CONTEXT BEING RETURNED ❌');
  }
  
  return context;
};
