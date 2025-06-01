
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== updateProfile START =====');
  console.log('🎯 [PROFILE_SERVICE_DEBUG] userId:', userId);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] updates:', updates);
  
  try {
    const updateData = {
      id: userId, // Include the user ID for upsert
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Final upsert data:', updateData);
    
    // Use upsert (INSERT ... ON CONFLICT DO UPDATE) to handle both create and update cases
    const { data, error } = await supabase
      .from('profiles')
      .upsert(updateData, { 
        onConflict: 'id'
      });

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
