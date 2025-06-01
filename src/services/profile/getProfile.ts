
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== getProfile START =====');
  console.log('🎯 [PROFILE_SERVICE_DEBUG] Input userId:', userId);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] userId type:', typeof userId);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] userId length:', userId?.length);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] Supabase client available:', !!supabase);
  
  try {
    console.log('🎯 [PROFILE_SERVICE_DEBUG] About to execute Supabase query...');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Query: supabase.from("profiles").select("*").eq("id", userId).maybeSingle()');
    
    // Add a small delay to see if timing is an issue
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Adding small delay before query...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Executing query now...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('🎯 [PROFILE_SERVICE_DEBUG] Query execution completed');
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
      console.log('🎯 [PROFILE_SERVICE_DEBUG] Returning null due to error');
      return null;
    }

    console.log('🎯 [PROFILE_SERVICE_DEBUG] No error, processing data...');
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
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Returning null due to exception');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== getProfile END (exception) =====');
    return null;
  }
};
