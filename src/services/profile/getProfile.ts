
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('🎯 [PROFILE_SERVICE] === PROFILE SERVICE CALLED ===');
  console.log('🎯 [PROFILE_SERVICE] Getting profile for user:', userId);
  
  if (!userId || userId.length < 10) {
    console.error('🎯 [PROFILE_SERVICE] Invalid user ID:', userId);
    return null;
  }

  try {
    console.log('🎯 [PROFILE_SERVICE] Executing profile query...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('🎯 [PROFILE_SERVICE] Query completed:', {
      hasData: !!data,
      error: error?.message,
      dataKeys: data ? Object.keys(data) : 'no data'
    });

    if (error) {
      console.error('🎯 [PROFILE_SERVICE] Query error:', error.message);
      return null;
    }

    if (data) {
      console.log('🎯 [PROFILE_SERVICE] ✅ Profile found:', data);
    } else {
      console.log('🎯 [PROFILE_SERVICE] ⚠️ No profile found for user - this is normal for new users');
    }
    
    console.log('🎯 [PROFILE_SERVICE] === PROFILE SERVICE COMPLETE ===');
    return data;
    
  } catch (exception) {
    console.error('🎯 [PROFILE_SERVICE] === EXCEPTION CAUGHT ===');
    console.error('🎯 [PROFILE_SERVICE] Exception:', exception);
    return null;
  }
};
