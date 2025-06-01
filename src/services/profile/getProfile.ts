
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('🎯 [PROFILE_SERVICE] === PROFILE SERVICE CALLED ===');
  console.log('🎯 [PROFILE_SERVICE] Getting profile for user:', userId);
  console.log('🎯 [PROFILE_SERVICE] User ID length:', userId?.length);
  console.log('🎯 [PROFILE_SERVICE] Current timestamp:', new Date().toISOString());
  
  if (!userId || userId.length < 10) {
    console.error('🎯 [PROFILE_SERVICE] Invalid user ID:', userId);
    return null;
  }

  try {
    console.log('🎯 [PROFILE_SERVICE] About to check session...');
    
    // Check if we have a valid auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🎯 [PROFILE_SERVICE] Session check result:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      sessionUserId: session?.user?.id
    });
    
    if (sessionError) {
      console.error('🎯 [PROFILE_SERVICE] Session error:', sessionError);
      return null;
    }

    if (!session) {
      console.error('🎯 [PROFILE_SERVICE] No active session');
      return null;
    }

    if (session.user.id !== userId) {
      console.error('🎯 [PROFILE_SERVICE] Session user ID mismatch:', {
        sessionUserId: session.user.id,
        requestedUserId: userId
      });
      return null;
    }

    console.log('🎯 [PROFILE_SERVICE] Session validated, executing profile query...');
    
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
    console.error('🎯 [PROFILE_SERVICE] Exception message:', exception?.message);
    console.error('🎯 [PROFILE_SERVICE] Exception stack:', exception?.stack);
    return null;
  }
};
