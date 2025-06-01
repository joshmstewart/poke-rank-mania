
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  updated_at: string;
  created_at: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('🎯 [PROFILE_SERVICE_DETAILED] ===== getProfile() START =====');
  console.log('🎯 [PROFILE_SERVICE_DETAILED] Input userId:', userId);
  console.log('🎯 [PROFILE_SERVICE_DETAILED] userId type:', typeof userId);
  console.log('🎯 [PROFILE_SERVICE_DETAILED] userId length:', userId?.length);
  
  try {
    console.log('🎯 [PROFILE_SERVICE_DETAILED] About to query Supabase profiles table...');
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Query: SELECT * FROM profiles WHERE id =', userId);
    
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Calling supabase.from("profiles").select("*").eq("id", userId).maybeSingle()');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('🎯 [PROFILE_SERVICE_DETAILED] Supabase query completed');
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Raw response data:', data);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Raw response error:', error);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Data type:', typeof data);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Data is null:', data === null);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Data is undefined:', data === undefined);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Error exists:', !!error);

    if (error) {
      console.error('🎯 [PROFILE_SERVICE_DETAILED] Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.log('🎯 [PROFILE_SERVICE_DETAILED] Returning null due to error');
      console.log('🎯 [PROFILE_SERVICE_DETAILED] ===== getProfile() END (with error) =====');
      return null;
    }

    console.log('🎯 [PROFILE_SERVICE_DETAILED] No error, returning data:', data);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Data will be returned as:', data);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] ===== getProfile() END (success) =====');
    return data;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE_DETAILED] Exception in getProfile:', error);
    console.error('🎯 [PROFILE_SERVICE_DETAILED] Exception type:', typeof error);
    console.error('🎯 [PROFILE_SERVICE_DETAILED] Exception constructor:', error?.constructor?.name);
    
    if (error instanceof Error) {
      console.error('🎯 [PROFILE_SERVICE_DETAILED] Exception message:', error.message);
      console.error('🎯 [PROFILE_SERVICE_DETAILED] Exception stack:', error.stack);
    }
    
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Returning null due to exception');
    console.log('🎯 [PROFILE_SERVICE_DETAILED] ===== getProfile() END (with exception) =====');
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🎯 [PROFILE_SERVICE_DETAILED] ===== updateProfile() START =====');
  console.log('🎯 [PROFILE_SERVICE_DETAILED] Input userId:', userId);
  console.log('🎯 [PROFILE_SERVICE_DETAILED] Updates:', updates);
  
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    console.log('🎯 [PROFILE_SERVICE_DETAILED] Final update data:', updateData);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] About to execute Supabase update...');
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    console.log('🎯 [PROFILE_SERVICE_DETAILED] Update completed with error:', error);

    if (error) {
      console.error('🎯 [PROFILE_SERVICE_DETAILED] Update error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('🎯 [PROFILE_SERVICE_DETAILED] Update successful');
    console.log('🎯 [PROFILE_SERVICE_DETAILED] ===== updateProfile() END =====');
    return true;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE_DETAILED] Exception updating profile:', error);
    console.log('🎯 [PROFILE_SERVICE_DETAILED] ===== updateProfile() END (with exception) =====');
    return false;
  }
};
