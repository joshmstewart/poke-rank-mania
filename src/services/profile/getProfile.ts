
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== getProfile START =====');
  console.log('🎯 [PROFILE_SERVICE_DEBUG] Input userId:', userId);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] userId type:', typeof userId);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] userId length:', userId?.length);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] Supabase client available:', !!supabase);
  
  // Check if we have a valid auth session
  try {
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Testing auth session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Current session check:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionError: sessionError?.message,
      matchesRequestedUserId: session?.user?.id === userId,
      sessionAccessToken: session?.access_token ? 'present' : 'missing'
    });
    
    if (!session) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] 🚨 NO ACTIVE SESSION - this will cause RLS to block access 🚨');
      return null;
    }
    
    if (session.user.id !== userId) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] 🚨 SESSION USER ID MISMATCH 🚨');
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Session user ID:', session.user.id);
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Requested user ID:', userId);
      return null;
    }
    
  } catch (err) {
    console.error('🎯 [PROFILE_SERVICE_DEBUG] Session check failed:', err);
  }
  
  // Test basic database connectivity first
  try {
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Testing basic database connectivity...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Database connectivity test:', {
      testData,
      testError: testError?.message,
      connected: !testError
    });
    
    if (testError) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] 🚨 DATABASE CONNECTION FAILED 🚨');
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Connection error:', testError);
      return null;
    }
  } catch (connErr) {
    console.error('🎯 [PROFILE_SERVICE_DEBUG] Database connection exception:', connErr);
    return null;
  }
  
  try {
    console.log('🎯 [PROFILE_SERVICE_DEBUG] About to execute Supabase query...');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Query: supabase.from("profiles").select("*").eq("id", userId).maybeSingle()');
    
    // Add a small delay to see if timing is an issue
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Adding small delay before query...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Executing query now...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const endTime = Date.now();
    const queryDuration = endTime - startTime;

    console.log('🎯 [PROFILE_SERVICE_DEBUG] Query execution completed');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Query duration:', queryDuration, 'ms');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Raw data:', data);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Raw error:', error);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Data type:', typeof data);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Data === null:', data === null);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Data === undefined:', data === undefined);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Error exists:', !!error);

    if (error) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Supabase error:', error);
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Error message:', error.message);
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Error details:', error.details);
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Error hint:', error.hint);
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Error code:', error.code);
      
      // Check if it's an RLS policy violation
      if (error.message?.includes('policy') || error.code === 'PGRST116') {
        console.error('🎯 [PROFILE_SERVICE_DEBUG] 🚨 RLS POLICY VIOLATION DETECTED 🚨');
        console.error('🎯 [PROFILE_SERVICE_DEBUG] This might be an authentication or permissions issue');
      }
      
      console.log('🎯 [PROFILE_SERVICE_DEBUG] Returning null due to error');
      return null;
    }

    console.log('🎯 [PROFILE_SERVICE_DEBUG] No error, processing data...');
    
    if (data === null) {
      console.log('🎯 [PROFILE_SERVICE_DEBUG] ⚠️ No profile found for user:', userId);
      console.log('🎯 [PROFILE_SERVICE_DEBUG] This user may not have a profile record yet');
    } else {
      console.log('🎯 [PROFILE_SERVICE_DEBUG] ✅ Profile found successfully:', data);
    }
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Final return value:', data);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== getProfile END =====');
    return data;
    
  } catch (exception) {
    console.error('🎯 [PROFILE_SERVICE_DEBUG] ===== EXCEPTION CAUGHT =====');
    console.error('🎯 [PROFILE_SERVICE_DEBUG] Exception:', exception);
    console.error('🎯 [PROFILE_SERVICE_DEBUG] Exception type:', typeof exception);
    console.error('🎯 [PROFILE_SERVICE_DEBUG] Exception constructor:', exception?.constructor?.name);
    
    if (exception instanceof Error) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Exception message:', exception.message);
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Exception stack:', exception.stack);
    }
    
    // Check if it's a network error
    if (exception?.message?.includes('fetch') || exception?.message?.includes('network')) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] 🚨 NETWORK ERROR DETECTED 🚨');
    }
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Returning null due to exception');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== getProfile END (exception) =====');
    return null;
  }
};
