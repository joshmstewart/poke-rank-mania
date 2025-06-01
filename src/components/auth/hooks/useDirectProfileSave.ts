
import { useState, useCallback } from 'react';
import { updateProfile } from '@/services/profile/updateProfile';
import { toast } from '@/hooks/use-toast';

export const useDirectProfileSave = () => {
  const [isSaving, setIsSaving] = useState(false);

  const directSaveProfile = useCallback(async (
    userId: string,
    profileData: {
      avatar_url: string;
      username: string;
      display_name: string;
    }
  ) => {
    console.log('🚀 [DIRECT_SAVE] Starting save operation');
    console.log('🚀 [DIRECT_SAVE] User ID:', userId);
    console.log('🚀 [DIRECT_SAVE] Profile data:', profileData);
    console.log('🚀 [DIRECT_SAVE] Current isSaving state:', isSaving);

    if (isSaving) {
      console.log('🚀 [DIRECT_SAVE] Already saving, returning false');
      return false;
    }

    if (!userId) {
      console.error('🚀 [DIRECT_SAVE] No user ID provided');
      toast({
        title: 'Error',
        description: 'User ID is required to save profile.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      console.log('🚀 [DIRECT_SAVE] Setting isSaving to true');
      setIsSaving(true);
      
      console.log('🚀 [DIRECT_SAVE] Calling updateProfile service...');
      const result = await updateProfile(userId, profileData);
      
      console.log('🚀 [DIRECT_SAVE] updateProfile result:', result);
      
      if (result) {
        console.log('🚀 [DIRECT_SAVE] Save successful, showing success toast');
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        console.log('🚀 [DIRECT_SAVE] Save failed, showing error toast');
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('🚀 [DIRECT_SAVE] Exception caught:', error);
      toast({
        title: 'Save Error',
        description: `An error occurred: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      console.log('🚀 [DIRECT_SAVE] Setting isSaving to false in finally block');
      setIsSaving(false);
    }
  }, []); // Remove isSaving from dependencies to prevent stale closures

  return { isSaving, directSaveProfile };
};
