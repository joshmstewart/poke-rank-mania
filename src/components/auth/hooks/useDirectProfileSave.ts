
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
    console.log('🔥🔥🔥 [DIRECT_SAVE] Starting direct save approach');
    console.log('🔥🔥🔥 [DIRECT_SAVE] User ID:', userId);
    console.log('🔥🔥🔥 [DIRECT_SAVE] Profile data:', profileData);
    
    if (isSaving) {
      console.log('🔥🔥🔥 [DIRECT_SAVE] Already saving, blocked');
      return false;
    }

    setIsSaving(true);
    console.log('🔥🔥🔥 [DIRECT_SAVE] Set saving to true');

    try {
      const result = await updateProfile(userId, profileData);
      console.log('🔥🔥🔥 [DIRECT_SAVE] Update result:', result);
      
      if (result) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        console.log('🔥🔥🔥 [DIRECT_SAVE] Success toast shown');
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
        console.log('🔥🔥🔥 [DIRECT_SAVE] Error toast shown');
      }
      
      return result;
    } catch (error) {
      console.error('🔥🔥🔥 [DIRECT_SAVE] Exception:', error);
      toast({
        title: 'Save Error',
        description: `An error occurred: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
      console.log('🔥🔥🔥 [DIRECT_SAVE] Set saving to false');
    }
  }, [isSaving]);

  return { isSaving, directSaveProfile };
};
