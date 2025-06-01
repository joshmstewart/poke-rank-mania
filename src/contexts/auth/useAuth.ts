
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
    userEmail: context.user?.email || 'NO_USER_EMAIL_IN_CONTEXT',
    sessionUserEmail: context.session?.user?.email || 'NO_SESSION_EMAIL_IN_CONTEXT',
    userId: context.user?.id || 'NO_USER_ID_IN_CONTEXT',
    sessionUserId: context.session?.user?.id || 'NO_SESSION_ID_IN_CONTEXT',
    userObjectDetails: context.user ? {
      id: context.user.id,
      email: context.user.email,
      email_confirmed_at: context.user.email_confirmed_at,
      phone: context.user.phone,
      created_at: context.user.created_at,
      user_metadata: context.user.user_metadata,
      app_metadata: context.user.app_metadata
    } : 'NO_USER_OBJECT_IN_CONTEXT',
    sessionUserObjectDetails: context.session?.user ? {
      id: context.session.user.id,
      email: context.session.user.email,
      email_confirmed_at: context.session.user.email_confirmed_at,
      phone: context.session.user.phone,
      created_at: context.session.user.created_at,
      user_metadata: context.session.user.user_metadata,
      app_metadata: context.session.user.app_metadata
    } : 'NO_SESSION_USER_OBJECT_IN_CONTEXT',
    timestamp: new Date().toISOString()
  });
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Call stack:', new Error().stack);
  
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] 🎯 RETURNING TO CONSUMER 🎯');
  console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Consumer will receive:', {
    hasUser: !!context.user,
    hasSession: !!context.session,
    loading: context.loading,
    userEmail: context.user?.email || 'NO_EMAIL_TO_CONSUMER',
    userId: context.user?.id || 'NO_ID_TO_CONSUMER',
    sessionUserEmail: context.session?.user?.email || 'NO_SESSION_EMAIL_TO_CONSUMER',
    sessionUserId: context.session?.user?.id || 'NO_SESSION_ID_TO_CONSUMER',
    functions: 'signIn, signOut, etc.'
  });
  
  if (context.user || context.session?.user) {
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] ✅ AUTHENTICATED CONTEXT BEING RETURNED ✅');
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Authenticated user email from context.user:', context.user?.email || 'NO_EMAIL_FROM_USER');
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Authenticated user ID from context.user:', context.user?.id || 'NO_ID_FROM_USER');
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Authenticated user email from context.session.user:', context.session?.user?.email || 'NO_EMAIL_FROM_SESSION');
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Authenticated user ID from context.session.user:', context.session?.user?.id || 'NO_ID_FROM_SESSION');
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] Auth components should now render authenticated UI WITH EMAIL');
  } else if (context.loading) {
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] ⏳ LOADING CONTEXT BEING RETURNED ⏳');
  } else {
    console.log('🔴🔴🔴 [USE_AUTH_ULTIMATE] ❌ UNAUTHENTICATED CONTEXT BEING RETURNED ❌');
  }
  
  return context;
};
