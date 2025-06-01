
import { useState, useCallback } from 'react';
import { updateProfile } from '@/services/profile/updateProfile';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth/useAuth';
import { useProfileCache } from './useProfileCache';

export const useDirectProfileSave = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { invalidateCache } = useProfileCache();

  const directSaveProfile = useCallback(async (
    userId: string,
    profileData: {
      avatar_url: string;
      username: string;
      display_name: string;
    }
  ) => {
    console.log('🚀 [DIRECT_SAVE] Starting save operation');

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
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile update timeout after 8 seconds')), 8000);
      });
      
      const updatePromise = updateProfile(userId, profileData);
      
      const result = await Promise.race([updatePromise, timeoutPromise]);
      
      console.log('🚀📢 [DIRECT_SAVE] updateProfile service returned:', result);
      
      if (result) {
        console.log('🚀✅ [DIRECT_SAVE] Save successful, invalidating cache and updating context');
        
        // Invalidate profile cache to force refresh
        invalidateCache(userId);
        
        // Force a fresh auth context update by dispatching custom event
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: { userId, profileData }
        }));
        
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
    }
  }, [isSaving, invalidateCache]);

  return { isSaving, directSaveProfile };
};
