
import { useState } from 'react';
import { updateProfile } from '@/services/profile/updateProfile';
import { toast } from '@/hooks/use-toast';

export const useSimpleProfileSave = () => {
  const [saving, setSaving] = useState(false);

  const saveProfile = async (userId: string, profileData: {
    avatar_url: string;
    username: string;
    display_name: string;
  }) => {
    console.log('🔥 [SIMPLE_SAVE] Starting simple save process');
    console.log('🔥 [SIMPLE_SAVE] User ID:', userId);
    console.log('🔥 [SIMPLE_SAVE] Profile data:', profileData);
    
    if (saving) {
      console.log('🔥 [SIMPLE_SAVE] Already saving, skipping');
      return false;
    }

    try {
      console.log('🔥 [SIMPLE_SAVE] Setting saving to true');
      setSaving(true);
      
      console.log('🔥 [SIMPLE_SAVE] Calling updateProfile...');
      const success = await updateProfile(userId, profileData);
      
      console.log('🔥 [SIMPLE_SAVE] updateProfile returned:', success);
      
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
      
      console.log('🔥 [SIMPLE_SAVE] Setting saving to false');
      setSaving(false);
      
      return success;
    } catch (error) {
      console.error('🔥 [SIMPLE_SAVE] Error during save:', error);
      setSaving(false);
      toast({
        title: 'Save Error',
        description: `An error occurred: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      return false;
    }
  };

  return { saving, saveProfile };
};
