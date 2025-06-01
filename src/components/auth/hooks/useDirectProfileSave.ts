
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

    if (isSaving) {
      console.log('🚀 [DIRECT_SAVE] Already saving, ignoring request');
      return false;
    }

    setIsSaving(true);

    if (!userId) {
      console.error('🚀 [DIRECT_SAVE] No user ID provided');
      toast({
        title: 'Error',
        description: 'User ID is required to save profile.',
        variant: 'destructive',
      });
      setIsSaving(false);
      return false;
    }

    try {
      console.log('🚀 [DIRECT_SAVE] Calling updateProfile service...');
      
      // Temporarily increase timeout to 60 seconds for debugging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile update timeout after 60 seconds')), 60000);
      });
      
      const updatePromise = updateProfile(userId, profileData);
      
      const result = await Promise.race([updatePromise, timeoutPromise]);
      
      console.log('🚀📢 [DIRECT_SAVE] updateProfile service returned:', result);
      
      if (result) {
        console.log('🚀✅ [DIRECT_SAVE] Save successful, showing success toast');
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        console.log('🚀❌ [DIRECT_SAVE] Save failed, showing error toast');
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('🚀🔥 [DIRECT_SAVE] Exception caught:', error);
      toast({
        title: 'Save Error',
        description: `An error occurred: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      console.log('🚀🏁 [DIRECT_SAVE] Entering finally block. Resetting isSaving.');
      setIsSaving(false);
      console.log('🚀🏁 [DIRECT_SAVE] isSaving SET TO FALSE');
    }
  }, []); // Removed isSaving from dependencies to prevent recreation

  return { isSaving, directSaveProfile };
};
