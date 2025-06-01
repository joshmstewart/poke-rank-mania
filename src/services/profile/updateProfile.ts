
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  console.log('🔍 [PROFILE_DEBUG] ===== STARTING SIMPLE PROFILE UPDATE =====');
  console.log('🔍 [PROFILE_DEBUG] User ID:', userId);
  console.log('🔍 [PROFILE_DEBUG] Updates:', updates);
  console.log('🔍 [PROFILE_DEBUG] Supabase client exists:', !!supabase);
  
  // Check if we can even connect to Supabase
  try {
    const { data: testData, error: testError } = await supabase.from('profiles').select('count').limit(1);
    console.log('🔍 [PROFILE_DEBUG] Supabase connection test:', { testData, testError });
  } catch (e) {
    console.error('🔍 [PROFILE_DEBUG] Supabase connection failed:', e);
    return false;
  }

  try {
    // Step 1: Try to check if profile exists with the simplest possible query
    console.log('🔍 [PROFILE_DEBUG] Step 1: Checking if profile exists...');
    const { data: existingProfiles, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);

    console.log('🔍 [PROFILE_DEBUG] Existing profiles query result:', {
      data: existingProfiles,
      error: selectError,
      count: existingProfiles?.length || 0
    });

    const profileExists = existingProfiles && existingProfiles.length > 0;
    console.log('🔍 [PROFILE_DEBUG] Profile exists?', profileExists);

    // Step 2: Prepare the data
    const now = new Date().toISOString();
    const profileData = {
      id: userId,
      ...updates,
      updated_at: now,
      ...(profileExists ? {} : { created_at: now })
    };

    console.log('🔍 [PROFILE_DEBUG] Step 2: Prepared data:', profileData);

    // Step 3: Try the simplest possible approach - delete and insert
    if (profileExists) {
      console.log('🔍 [PROFILE_DEBUG] Step 3a: Profile exists, trying UPDATE...');
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: now
        })
        .eq('id', userId)
        .select();

      console.log('🔍 [PROFILE_DEBUG] Update result:', { updateData, updateError });
      
      if (updateError) {
        console.error('🔍 [PROFILE_DEBUG] Update failed:', updateError);
        return false;
      }
      
      console.log('🔍 [PROFILE_DEBUG] Update successful!');
      return true;
    } else {
      console.log('🔍 [PROFILE_DEBUG] Step 3b: Profile does not exist, trying INSERT...');
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select();

      console.log('🔍 [PROFILE_DEBUG] Insert result:', { insertData, insertError });
      
      if (insertError) {
        console.error('🔍 [PROFILE_DEBUG] Insert failed:', insertError);
        return false;
      }
      
      console.log('🔍 [PROFILE_DEBUG] Insert successful!');
      return true;
    }

  } catch (exception) {
    console.error('🔍 [PROFILE_DEBUG] Exception caught:', exception);
    console.error('🔍 [PROFILE_DEBUG] Exception stack:', exception.stack);
    return false;
  }
};
