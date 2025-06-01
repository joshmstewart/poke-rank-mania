
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
  try {
    console.log('🎯 [PROFILE_SERVICE] Fetching profile for user ID:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('🎯 [PROFILE_SERVICE] Error fetching profile:', error);
      return null;
    }

    console.log('🎯 [PROFILE_SERVICE] Profile fetch result:', data);
    return data;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE] Exception fetching profile:', error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  try {
    console.log('🎯 [PROFILE_SERVICE] Updating profile for user ID:', userId, 'with:', updates);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('🎯 [PROFILE_SERVICE] Error updating profile:', error);
      return false;
    }

    console.log('🎯 [PROFILE_SERVICE] Profile updated successfully');
    return true;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE] Exception updating profile:', error);
    return false;
  }
};
