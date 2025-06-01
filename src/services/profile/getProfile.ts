
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('🎯 [PROFILE_SERVICE] Getting profile for user:', userId);
  
  if (!userId || userId.length < 10) {
    console.error('🎯 [PROFILE_SERVICE] Invalid user ID:', userId);
    return null;
  }

  try {
    // Check if we have a valid auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('🎯 [PROFILE_SERVICE] Session error:', sessionError);
      return null;
    }

    if (!session) {
      console.error('🎯 [PROFILE_SERVICE] No active session');
      return null;
    }

    if (session.user.id !== userId) {
      console.error('🎯 [PROFILE_SERVICE] Session user ID mismatch');
      return null;
    }

    console.log('🎯 [PROFILE_SERVICE] Executing profile query...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('🎯 [PROFILE_SERVICE] Query error:', error.message);
      return null;
    }

    if (data) {
      console.log('🎯 [PROFILE_SERVICE] ✅ Profile found:', data);
    } else {
      console.log('🎯 [PROFILE_SERVICE] ⚠️ No profile found for user');
    }
    
    return data;
    
  } catch (exception) {
    console.error('🎯 [PROFILE_SERVICE] Exception:', exception);
    return null;
  }
};
