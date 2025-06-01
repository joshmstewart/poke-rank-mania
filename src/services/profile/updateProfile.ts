
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== updateProfile START =====');
  console.log('🎯 [PROFILE_SERVICE_DEBUG] userId:', userId);
  console.log('🎯 [PROFILE_SERVICE_DEBUG] updates:', updates);
  
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Final update data:', updateData);
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    console.log('🎯 [PROFILE_SERVICE_DEBUG] Update completed');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] Update error:', error);

    if (error) {
      console.error('🎯 [PROFILE_SERVICE_DEBUG] Update error details:', error);
      return false;
    }

    console.log('🎯 [PROFILE_SERVICE_DEBUG] Update successful');
    console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== updateProfile END =====');
    return true;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE_DEBUG] Exception in updateProfile:', error);
    console.log('🎯 [PROFILE_SERVICE_DEBUG] ===== updateProfile END (exception) =====');
    return false;
  }
};
