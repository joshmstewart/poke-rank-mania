
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] ===== useAuth CALLED =====');
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] Context received from AuthProvider:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email,
    sessionUserEmail: context.session?.user?.email,
    userId: context.user?.id,
    sessionUserId: context.session?.user?.id,
    timestamp: new Date().toISOString()
  });
  
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] 🎯 RETURNING TO CONSUMER 🎯');
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] Consumer will receive:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email,
    functions: 'signIn, signOut, etc.'
  });
  
  if (context.user || context.session?.user) {
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] ✅ AUTHENTICATED CONTEXT BEING RETURNED ✅');
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] Auth components should now render authenticated UI');
  } else if (context.loading) {
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] ⏳ LOADING CONTEXT BEING RETURNED ⏳');
  } else {
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] ❌ UNAUTHENTICATED CONTEXT BEING RETURNED ❌');
  }
  
  return context;
};
