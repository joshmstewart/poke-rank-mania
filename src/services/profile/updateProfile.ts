
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🚀 [PROFILE_UPDATE] ===== STARTING UPSERT PROFILE =====');
  console.log('🚀 [PROFILE_UPDATE] User ID:', userId);
  console.log('🚀 [PROFILE_UPDATE] Updates:', updates);
  console.log('🚀 [PROFILE_UPDATE] Supabase client available:', !!supabase);
  
  if (!userId || userId.length < 10) {
    console.error('🚀 [PROFILE_UPDATE] Invalid user ID:', userId);
    return false;
  }

  try {
    // First, let's verify we can connect to the profiles table
    console.log('🚀 [PROFILE_UPDATE] Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('🚀 [PROFILE_UPDATE] Connection test result:', { testData, testError });
    
    if (testError) {
      console.error('🚀 [PROFILE_UPDATE] Database connection failed:', testError);
      return false;
    }

    const now = new Date().toISOString();
    
    // Prepare the complete profile data for upsert
    const profileData = {
      id: userId,
      ...updates,
      updated_at: now
    };

    console.log('🚀 [PROFILE_UPDATE] Attempting upsert with data:', profileData);
    console.log('🚀 [PROFILE_UPDATE] Calling supabase.from("profiles").upsert()...');

    // Use upsert with onConflict to handle both insert and update
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single();

    console.log('🚀 [PROFILE_UPDATE] Upsert result:', { data, error });
    console.log('🚀 [PROFILE_UPDATE] Error details:', error ? {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    } : 'No error');

    if (error) {
      console.error('🚀 [PROFILE_UPDATE] Upsert failed:', error);
      return false;
    }

    console.log('🚀 [PROFILE_UPDATE] ✅ Profile upsert successful!');
    return true;

  } catch (exception) {
    console.error('🚀 [PROFILE_UPDATE] Exception caught:', exception);
    console.error('🚀 [PROFILE_UPDATE] Exception details:', {
      name: exception.name,
      message: exception.message,
      stack: exception.stack
    });
    return false;
  }
};
