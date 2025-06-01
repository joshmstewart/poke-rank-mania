
import { supabase } from '@/integrations/supabase/client';

export const authService = {
  signIn: async (email: string, password: string) => {
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Starting email/password sign in...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Email/password sign in result:', { error: error?.message });
    return { error };
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Starting email/password sign up...');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Email/password sign up result:', { error: error?.message });
    return { error };
  },

  signOut: async () => {
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] ===== SIGN OUT START =====');
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Starting comprehensive sign out process...');
    
    try {
      // Step 1: Clear any local storage auth data first
      console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Clearing local storage auth data...');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Removing localStorage key:', key);
          localStorage.removeItem(key);
        }
      });

      // Step 2: Attempt Supabase sign out with global scope
      console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('🔴🔴🔴 [AUTH_SERVICE_FIXED] Supabase signOut error:', error);
        // Continue with cleanup even if signOut fails
      } else {
        console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] ✅ Supabase signOut successful');
      }

      // Step 3: Force a brief delay to allow auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] ✅ SIGN OUT COMPLETE ✅');
      
    } catch (error) {
      console.error('🔴🔴🔴 [AUTH_SERVICE_FIXED] ❌ Sign out error:', error);
      // Even if there's an error, we've cleared local storage
    }
  },

  signInWithGoogle: async () => {
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Starting Google sign in...');
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Current URL:', window.location.href);
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Origin:', window.location.origin);
    
    // CRITICAL FIX: Use the current origin to prevent redirect to live site
    const currentOrigin = window.location.origin;
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Using redirect URL:', currentOrigin);
    
    // For dev environment, ensure we stay on the correct domain
    const isDevEnvironment = currentOrigin.includes('lovableproject.com') || currentOrigin.includes('localhost');
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Is dev environment:', isDevEnvironment);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: currentOrigin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] Google sign in result:', { error: error?.message });
    
    if (error) {
      console.error('🔴🔴🔴 [AUTH_SERVICE_FIXED] Google OAuth error:', error);
    }
    
    return { error };
  },

  signInWithPhone: async (phone: string) => {
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Starting phone sign in...');
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Phone number:', phone);
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Current environment:', window.location.origin);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Phone OTP request result:', { 
      error: error?.message,
      phoneUsed: phone,
      timestamp: new Date().toISOString()
    });
    
    if (error) {
      console.error('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Phone auth error:', error);
    } else {
      console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 OTP should be sent to phone, ready for verification');
    }
    
    return { error };
  },

  verifyPhoneOtp: async (phone: string, token: string) => {
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Starting phone OTP verification...');
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Phone:', phone);
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Token length:', token.length);
    
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });
    
    console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Phone OTP verification result:', { 
      error: error?.message,
      phoneUsed: phone,
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
    
    if (error) {
      console.error('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 Phone OTP verification error:', error);
    } else {
      console.log('🔴🔴🔴 [AUTH_SERVICE_FIXED] 📱 ✅ PHONE LOGIN SUCCESS - USER SHOULD NOW BE AUTHENTICATED ✅');
    }
    
    return { error };
  },
};
