
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('🔴🔴🔴 [USE_AUTH_FIXED] ❌ useAuth called outside AuthProvider!');
    console.error('🔴🔴🔴 [USE_AUTH_FIXED] Call stack:', new Error().stack);
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] ===== useAuth CALLED =====');
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] Context received from AuthProvider:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email || null,
    userPhone: context.user?.phone || null,
    sessionUserEmail: context.session?.user?.email || null,
    sessionUserPhone: context.session?.user?.phone || null,
    userId: context.user?.id || context.session?.user?.id || null,
    userObjectDetails: context.user ? {
      id: context.user.id,
      email: context.user.email,
      phone: context.user.phone,
      email_confirmed_at: context.user.email_confirmed_at,
      phone_confirmed_at: context.user.phone_confirmed_at,
      created_at: context.user.created_at,
      user_metadata: context.user.user_metadata,
      app_metadata: context.user.app_metadata
    } : null,
    timestamp: new Date().toISOString()
  });
  
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] 🎯 RETURNING TO CONSUMER 🎯');
  console.log('🔴🔴🔴 [USE_AUTH_FIXED] Consumer will receive:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email || null,
    userPhone: context.user?.phone || null,
    userId: context.user?.id || context.session?.user?.id || null,
    functions: 'signIn, signOut, etc.'
  });
  
  if (context.user || context.session?.user) {
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] ✅ AUTHENTICATED CONTEXT BEING RETURNED ✅');
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] Authenticated user email:', context.user?.email || context.session?.user?.email || null);
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] Authenticated user phone:', context.user?.phone || context.session?.user?.phone || null);
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] Authenticated user ID:', context.user?.id || context.session?.user?.id || null);
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] Auth components should now render authenticated UI');
  } else if (context.loading) {
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] ⏳ LOADING CONTEXT BEING RETURNED ⏳');
  } else {
    console.log('🔴🔴🔴 [USE_AUTH_FIXED] ❌ UNAUTHENTICATED CONTEXT BEING RETURNED ❌');
  }
  
  return context;
};
