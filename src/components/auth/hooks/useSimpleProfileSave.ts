
import React, { useState, useRef, useCallback } from 'react';
import { updateProfile } from '@/services/profile/updateProfile';
import { toast } from '@/hooks/use-toast';

export const useSimpleProfileSave = () => {
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  console.log('🔥 [SIMPLE_SAVE_HOOK] ===== HOOK INITIALIZATION =====');
  console.log('🔥 [SIMPLE_SAVE_HOOK] Initial saving state:', saving);

  const saveProfile = useCallback(async (userId: string, profileData: {
    avatar_url: string;
    username: string;
    display_name: string;
  }) => {
    console.log('🔥 [SIMPLE_SAVE] ===== STARTING SAVE OPERATION =====');
    console.log('🔥 [SIMPLE_SAVE] User ID:', userId);
    console.log('🔥 [SIMPLE_SAVE] Profile data:', profileData);
    console.log('🔥 [SIMPLE_SAVE] Current saving state:', saving);
    console.log('🔥 [SIMPLE_SAVE] Component mounted:', mountedRef.current);
    
    if (saving) {
      console.log('🔥 [SIMPLE_SAVE] ❌ Already saving, skipping');
      return false;
    }

    if (!mountedRef.current) {
      console.log('🔥 [SIMPLE_SAVE] ❌ Component unmounted, skipping');
      return false;
    }

    try {
      console.log('🔥 [SIMPLE_SAVE] ✅ Setting saving to true...');
      setSaving(true);
      
      console.log('🔥 [SIMPLE_SAVE] About to call updateProfile...');
      const startTime = Date.now();
      
      const success = await updateProfile(userId, profileData);
      
      const endTime = Date.now();
      console.log('🔥 [SIMPLE_SAVE] updateProfile completed in', (endTime - startTime), 'ms with result:', success);
      
      if (!mountedRef.current) {
        console.log('🔥 [SIMPLE_SAVE] Component unmounted during save, not updating state');
        return success;
      }
      
      if (success) {
        console.log('🔥 [SIMPLE_SAVE] ✅ Save successful, showing success toast');
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        console.log('🔥 [SIMPLE_SAVE] ❌ Save failed, showing error toast');
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
      
      return success;
    } catch (error) {
      console.error('🔥 [SIMPLE_SAVE] ❌ Exception caught during save:', error);
      
      if (mountedRef.current) {
        toast({
          title: 'Save Error',
          description: `An error occurred: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      if (mountedRef.current) {
        console.log('🔥 [SIMPLE_SAVE] Setting saving to false in finally block');
        setSaving(false);
      }
      console.log('🔥 [SIMPLE_SAVE] ===== SAVE OPERATION COMPLETED =====');
    }
  }, [saving]);

  // Effect to cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log('🔥 [SIMPLE_SAVE] Hook unmounting, setting mountedRef to false');
      mountedRef.current = false;
    };
  }, []);

  // Debug effect to track saving state changes
  React.useEffect(() => {
    console.log('🔥 [SIMPLE_SAVE] ===== SAVING STATE CHANGED =====');
    console.log('🔥 [SIMPLE_SAVE] New saving state:', saving);
    console.log('🔥 [SIMPLE_SAVE] Timestamp:', new Date().toISOString());
  }, [saving]);

  return { saving, saveProfile };
};
