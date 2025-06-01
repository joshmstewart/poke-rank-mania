
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
    if (isSaving) {
      return false;
    }

    setIsSaving(true);

    try {
      const result = await updateProfile(userId, profileData);
      
      if (result) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      toast({
        title: 'Save Error',
        description: `An error occurred: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  return { isSaving, directSaveProfile };
};
