
import { supabase } from '@/integrations/supabase/client';

export const authService = {
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  },

  signOut: async () => {
    console.log('🔴 AuthService: Signing out...');
    await supabase.auth.signOut();
  },

  signInWithGoogle: async () => {
    console.log('🔴 AuthService: Starting Google sign in...');
    console.log('🔴 AuthService: Current URL:', window.location.href);
    console.log('🔴 AuthService: Origin:', window.location.origin);
    
    // Use the current origin as redirect URL to prevent localhost issues
    const redirectUrl = window.location.origin;
    console.log('🔴 AuthService: Using redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    console.log('🔴 AuthService: Google sign in result:', { error: error?.message });
    
    if (error) {
      console.error('🔴 AuthService: Google OAuth error:', error);
    }
    
    return { error };
  },

  signInWithPhone: async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    return { error };
  },

  verifyPhoneOtp: async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });
    return { error };
  },
};
