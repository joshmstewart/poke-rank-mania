
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== updateProfile START =====');
  console.log('🎯 [PROFILE_SERVICE_DEBUG] userId:', userId);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] updates:', updates);
  
  try {
    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    console.log('🎯 [PROFILE_SERVICE_DEBUG] Existing profile check:', { existingProfile, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Unexpected error checking profile:', checkError);
      return false;
    }

    const updateData = {
      id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
      // Only set created_at if this is a new profile
      ...((!existingProfile && !checkError) ? {} : { created_at: new Date().toISOString() })
    };
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Final upsert data:', updateData);
    
    // Use upsert to handle both create and update cases
    const { data, error } = await supabase
      .from('profiles')
      .upsert(updateData, { 
        onConflict: 'id'
      })
      .select();

    console.log('🎯 [PROFILE_SERVICE_DEBUG] Upsert completed');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Upsert data:', data);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Upsert error:', error);

    if (error) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Upsert error details:', error);
      return false;
    }

    console.log('🎯 [PROFILE_SERVICE_DEBUG] Upsert successful');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== updateProfile END =====');
    return true;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE_DEBUG] Exception in updateProfile:', error);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== updateProfile END (exception) =====');
    return false;
  }
};
