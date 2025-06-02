
import { useState } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { updateProfile } from '@/services/profile';
import { useProfileCache } from './useProfileCache';

export const useDirectProfileSave = () => {
  const { user } = useAuth();
  const { invalidateCache } = useProfileCache();
  const [isSaving, setIsSaving] = useState(false);

  const directSaveProfile = async (userId: string, profileData: {
    avatar_url: string;
    username: string;
    display_name: string;
  }): Promise<boolean> => {
    console.log('🔘 [DIRECT_PROFILE_SAVE] ===== STARTING DIRECT SAVE =====');
    console.log('🔘 [DIRECT_PROFILE_SAVE] User ID:', userId);
    console.log('🔘 [DIRECT_PROFILE_SAVE] Profile data:', profileData);

    if (!userId || !user) {
      console.error('🔘 [DIRECT_PROFILE_SAVE] No user ID or user available');
      return false;
    }

    if (isSaving) {
      console.log('🔘 [DIRECT_PROFILE_SAVE] Already saving, skipping');
      return false;
    }

    setIsSaving(true);

    try {
      // Clear cache first to ensure fresh data
      console.log('🔘 [DIRECT_PROFILE_SAVE] Invalidating cache for user:', userId);
      invalidateCache(userId);

      // Save to database
      console.log('🔘 [DIRECT_PROFILE_SAVE] Calling updateProfile service...');
      const success = await updateProfile(userId, profileData);

      console.log('🔘 [DIRECT_PROFILE_SAVE] Update result:', success);

      if (success) {
        // Invalidate cache again after successful save
        invalidateCache(userId);
        
        // Dispatch profile update event with fresh data
        const updateEvent = new CustomEvent('profile-updated', {
          detail: { 
            userId: userId, 
            timestamp: new Date().toISOString(),
            avatar_url: profileData.avatar_url,
            username: profileData.username,
            display_name: profileData.display_name
          }
        });
        
        console.log('🔘 [DIRECT_PROFILE_SAVE] Dispatching profile-updated event:', updateEvent.detail);
        window.dispatchEvent(updateEvent);
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been saved successfully.',
        });
        
        return true;
      } else {
        console.error('🔘 [DIRECT_PROFILE_SAVE] Profile update failed');
        toast({
          title: 'Save failed',
          description: 'There was an error saving your profile. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      console.error('🔘 [DIRECT_PROFILE_SAVE] Save error:', error);
      
      toast({
        title: 'Save failed',
        description: 'There was an error saving your profile. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsSaving(false);
      console.log('🔘 [DIRECT_PROFILE_SAVE] ===== DIRECT SAVE COMPLETED =====');
    }
  };

  return {
    isSaving,
    directSaveProfile
  };
};
