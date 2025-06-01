
import React, { useState, useRef, useCallback } from 'react';
import { updateProfile } from '@/services/profile/updateProfile';
import { toast } from '@/hooks/use-toast';

export const useSimpleProfileSave = () => {
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);
  const savingRef = useRef(false);

  const saveProfile = useCallback(async (userId: string, profileData: {
    avatar_url: string;
    username: string;
    display_name: string;
  }) => {
    console.log('🔥 [SIMPLE_SAVE] Starting simple save process');
    console.log('🔥 [SIMPLE_SAVE] User ID:', userId);
    console.log('🔥 [SIMPLE_SAVE] Profile data:', profileData);
    console.log('🔥 [SIMPLE_SAVE] Current saving state:', savingRef.current);
    console.log('🔥 [SIMPLE_SAVE] Component mounted:', mountedRef.current);
    
    if (savingRef.current) {
      console.log('🔥 [SIMPLE_SAVE] Already saving, skipping');
      return false;
    }

    if (!mountedRef.current) {
      console.log('🔥 [SIMPLE_SAVE] Component unmounted, skipping');
      return false;
    }

    try {
      console.log('🔥 [SIMPLE_SAVE] Setting saving to true...');
      savingRef.current = true;
      setSaving(true);
      console.log('🔥 [SIMPLE_SAVE] setSaving(true) called');
      
      console.log('🔥 [SIMPLE_SAVE] Calling updateProfile...');
      const success = await updateProfile(userId, profileData);
      
      console.log('🔥 [SIMPLE_SAVE] updateProfile returned:', success);
      
      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        console.log('🔥 [SIMPLE_SAVE] Component unmounted during save, not updating state');
        return success;
      }
      
      if (success) {
        console.log('🔥 [SIMPLE_SAVE] Save successful, showing toast');
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        console.log('🔥 [SIMPLE_SAVE] Save failed, showing error');
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
      
      console.log('🔥 [SIMPLE_SAVE] About to set saving to false...');
      savingRef.current = false;
      setSaving(false);
      console.log('🔥 [SIMPLE_SAVE] setSaving(false) called - saving should now be false');
      
      return success;
    } catch (error) {
      console.error('🔥 [SIMPLE_SAVE] Error during save:', error);
      
      if (mountedRef.current) {
        console.log('🔥 [SIMPLE_SAVE] Error: setting saving to false');
        savingRef.current = false;
        setSaving(false);
        toast({
          title: 'Save Error',
          description: `An error occurred: ${error.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
      return false;
    }
  }, []); // Remove saving from dependencies to avoid stale closure

  // Effect to cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log('🔥 [SIMPLE_SAVE] Hook unmounting, setting mountedRef to false');
      mountedRef.current = false;
    };
  }, []);

  // Debug effect to track saving state changes
  React.useEffect(() => {
    console.log('🔥 [SIMPLE_SAVE] Saving state changed to:', saving);
    console.log('🔥 [SIMPLE_SAVE] SavingRef current value:', savingRef.current);
  }, [saving]);

  return { saving, saveProfile };
};
