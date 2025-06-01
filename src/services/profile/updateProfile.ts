
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🚀 [PROFILE_UPDATE] ===== STARTING UPSERT PROFILE =====');
  console.log('🚀 [PROFILE_UPDATE] User ID:', userId);
  console.log('🚀 [PROFILE_UPDATE] Updates:', updates);
  
  if (!userId || userId.length < 10) {
    console.error('🚀 [PROFILE_UPDATE] Invalid user ID:', userId);
    return false;
  }

  try {
    const now = new Date().toISOString();
    
    // Prepare the complete profile data for upsert
    const profileData = {
      id: userId,
      ...updates,
      updated_at: now
    };

    console.log('🚀 [PROFILE_UPDATE] Attempting upsert with data:', profileData);

    // Use upsert with onConflict to handle both insert and update
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single();

    console.log('🚀 [PROFILE_UPDATE] Upsert result:', { data, error });

    if (error) {
      console.error('🚀 [PROFILE_UPDATE] Upsert failed:', error);
      return false;
    }

    console.log('🚀 [PROFILE_UPDATE] ✅ Profile upsert successful!');
    return true;

  } catch (exception) {
    console.error('🚀 [PROFILE_UPDATE] Exception caught:', exception);
    return false;
  }
};
