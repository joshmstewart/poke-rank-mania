
import { useState } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { updateProfile } from '@/services/profile';
import { useProfileCache } from './useProfileCache';

export const useProfileSave = () => {
  const { user } = useAuth();
  const { invalidateCache } = useProfileCache();
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async (
    selectedAvatar: string,
    username: string,
    displayName: string,
    validateProfile: (username: string, displayName: string) => boolean,
    handleDatabaseError: (error: any) => void,
    clearErrors: () => void,
    onSuccess: () => void
  ) => {
    console.log('🎭 [PROFILE_SAVE] saveProfile called with user:', user?.id);
    
    if (!user?.id) {
      console.error('🎭 [PROFILE_SAVE] No user ID available');
      toast({
        title: 'Error',
        description: 'No user session found. Please try signing in again.',
        variant: 'destructive',
      });
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();
    
    if (!trimmedUsername || !trimmedDisplayName) {
      toast({
        title: 'Validation Error',
        description: 'Username and display name are required.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateProfile(trimmedUsername, trimmedDisplayName)) {
      console.log('🎭 [PROFILE_SAVE] Validation failed');
      return;
    }

    setIsSaving(true);
    clearErrors();

    try {
      console.log('🎭 [PROFILE_SAVE] Calling updateProfile service...');
      
      const success = await updateProfile(user.id, {
        username: trimmedUsername,
        display_name: trimmedDisplayName,
        avatar_url: selectedAvatar || '',
      });

      console.log('🎭 [PROFILE_SAVE] Update result:', success);

      if (success) {
        console.log('🎭 [PROFILE_SAVE] ✅ Profile saved successfully');
        
        invalidateCache(user.id);
        
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: { 
            userId: user.id, 
            timestamp: new Date().toISOString(),
            avatar_url: selectedAvatar,
            username: trimmedUsername,
            display_name: trimmedDisplayName
          }
        }));
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been saved successfully.',
        });
        
        onSuccess();
      } else {
        console.error('🎭 [PROFILE_SAVE] Profile update failed');
        toast({
          title: 'Save failed',
          description: 'There was an error saving your profile. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('🎭 [PROFILE_SAVE] Save error:', error);
      
      handleDatabaseError(error);
      
      toast({
        title: 'Save failed',
        description: 'There was an error saving your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveProfile
  };
};
