
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🚀🔵 [PROFILE_UPDATE_SVC] ===== STARTING PROFILE UPDATE SERVICE =====');
  console.log('🚀🔵 [PROFILE_UPDATE_SVC] User ID:', userId);
  console.log('🚀🔵 [PROFILE_UPDATE_SVC] Updates:', updates);
  console.log('🚀🔵 [PROFILE_UPDATE_SVC] Supabase client available:', !!supabase);
  
  if (!userId || userId.length < 10) {
    console.error('🚀🔴 [PROFILE_UPDATE_SVC] Invalid user ID:', userId);
    return false;
  }

  try {
    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Testing database connection...');
    const connectionStartTime = Date.now();
    
    // Add timeout to the connection test
    const testConnectionPromise = supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timeout')), 10000);
    });
    
    const { data: testData, error: testError } = await Promise.race([testConnectionPromise, timeoutPromise]);
    
    const connectionEndTime = Date.now();
    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Connection test completed in', (connectionEndTime - connectionStartTime), 'ms');
    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Connection test result:', { testData, testError });
    
    if (testError) {
      console.error('🚀🔴 [PROFILE_UPDATE_SVC] Database connection failed:', testError);
      return false;
    }

    const now = new Date().toISOString();
    
    // Prepare the complete profile data for upsert
    const profileData = {
      id: userId,
      ...updates,
      updated_at: now
    };

    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Attempting upsert with data:', profileData);
    console.log('🚀🔵 [PROFILE_UPDATE_SVC] About to call supabase.from("profiles").upsert()...');

    const upsertStartTime = Date.now();
    
    // Add timeout to the upsert operation
    const upsertPromise = supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single();

    const upsertTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upsert operation timeout')), 15000);
    });

    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Upsert promise created, awaiting result...');
    
    const { data, error } = await Promise.race([upsertPromise, upsertTimeoutPromise]);

    const upsertEndTime = Date.now();
    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Upsert completed in', (upsertEndTime - upsertStartTime), 'ms');
    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Upsert result data:', data);
    console.log('🚀🔵 [PROFILE_UPDATE_SVC] Upsert result error:', error);
    
    if (error) {
      console.error('🚀🔴 [PROFILE_UPDATE_SVC] Upsert failed with error:', error);
      console.error('🚀🔴 [PROFILE_UPDATE_SVC] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.log('🚀🔴 [PROFILE_UPDATE_SVC] Returning false due to upsert error');
      return false;
    }

    console.log('🚀🟢 [PROFILE_UPDATE_SVC] ✅ Profile upsert successful!');
    console.log('🚀🟢 [PROFILE_UPDATE_SVC] Returning true');
    return true;

  } catch (exception) {
    console.error('🚀🔥 [PROFILE_UPDATE_SVC] Exception caught:', exception);
    console.error('🚀🔥 [PROFILE_UPDATE_SVC] Exception type:', typeof exception);
    console.error('🚀🔥 [PROFILE_UPDATE_SVC] Exception details:', {
      name: exception?.name,
      message: exception?.message,
      stack: exception?.stack
    });
    console.log('🚀🔴 [PROFILE_UPDATE_SVC] Returning false due to exception');
    return false;
  } finally {
    console.log('🚀🏁 [PROFILE_UPDATE_SVC] ===== PROFILE UPDATE SERVICE COMPLETED =====');
  }
};
