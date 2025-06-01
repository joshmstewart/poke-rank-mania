
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🚀 [PROFILE_UPDATE] ===== STARTING PROFILE UPDATE =====');
  console.log('🚀 [PROFILE_UPDATE] User ID:', userId);
  console.log('🚀 [PROFILE_UPDATE] Updates:', updates);
  console.log('🚀 [PROFILE_UPDATE] Supabase client available:', !!supabase);
  
  if (!userId || userId.length < 10) {
    console.error('🚀 [PROFILE_UPDATE] Invalid user ID:', userId);
    return false;
  }

  try {
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
    console.log('🚀 [PROFILE_UPDATE] About to call supabase.from("profiles").upsert()...');

    // Use upsert with onConflict to handle both insert and update
    const upsertPromise = supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single();

    console.log('🚀 [PROFILE_UPDATE] Upsert promise created, awaiting result...');
    
    const { data, error } = await upsertPromise;

    console.log('🚀 [PROFILE_UPDATE] Upsert completed!');
    console.log('🚀 [PROFILE_UPDATE] Upsert result data:', data);
    console.log('🚀 [PROFILE_UPDATE] Upsert result error:', error);
    
    if (error) {
      console.error('🚀 [PROFILE_UPDATE] Upsert failed with error:', error);
      console.error('🚀 [PROFILE_UPDATE] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    console.log('🚀 [PROFILE_UPDATE] ✅ Profile upsert successful!');
    console.log('🚀 [PROFILE_UPDATE] Returning true');
    return true;

  } catch (exception) {
    console.error('🚀 [PROFILE_UPDATE] Exception caught:', exception);
    console.error('🚀 [PROFILE_UPDATE] Exception type:', typeof exception);
    console.error('🚀 [PROFILE_UPDATE] Exception details:', {
      name: exception?.name,
      message: exception?.message,
      stack: exception?.stack
    });
    return false;
  } finally {
    console.log('🚀 [PROFILE_UPDATE] ===== PROFILE UPDATE COMPLETED =====');
  }
};
