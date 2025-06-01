
import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useSimpleProfileSave } from './useSimpleProfileSave';

export const useProfileModalHandlers = (
  selectedAvatar: string,
  setSelectedAvatar: (value: string) => void,
  username: string,
  displayName: string,
  setAvatarModalOpen: (open: boolean) => void,
  onOpenChange: (open: boolean) => void,
  mountedRef: React.MutableRefObject<boolean>
) => {
  const { user } = useAuth();
  const { saving, saveProfile } = useSimpleProfileSave();

  const handleSave = useCallback(async () => {
    console.log('🚀🚀🚀 [PROFILE_MODAL_HANDLERS] HANDLE_SAVE CALLBACK TRIGGERED! 🚀🚀🚀');
    console.log('🚀 [PROFILE_MODAL_HANDLERS] Component mounted:', mountedRef.current);
    console.log('🚀 [PROFILE_MODAL_HANDLERS] Function called at:', new Date().toISOString());
    
    if (!mountedRef.current) {
      console.log('🚀 [PROFILE_MODAL_HANDLERS] Component unmounted, skipping save');
      return;
    }

    console.log('🚀 [PROFILE_MODAL_HANDLERS] ===== HANDLE SAVE CLICKED =====');
    console.log('🚀 [PROFILE_MODAL_HANDLERS] User ID:', user?.id);
    console.log('🚀 [PROFILE_MODAL_HANDLERS] Current saving state:', saving);
    console.log('🚀 [PROFILE_MODAL_HANDLERS] Form values:', {
      avatar: selectedAvatar,
      username: username?.trim(),
      displayName: displayName?.trim(),
      usernameLength: username?.trim()?.length,
      displayNameLength: displayName?.trim()?.length
    });

    if (!user?.id) {
      console.log('❌ [PROFILE_MODAL_HANDLERS] No user ID for save');
      return;
    }

    // Simplified validation - allow empty fields and let backend handle defaults
    const trimmedUsername = username?.trim() || '';
    const trimmedDisplayName = displayName?.trim() || '';
    
    console.log('🚀 [PROFILE_MODAL_HANDLERS] Trimmed values:', {
      trimmedUsername,
      trimmedDisplayName,
      selectedAvatar
    });

    if (saving) {
      console.log('❌ [PROFILE_MODAL_HANDLERS] Already saving, skipping');
      return;
    }

    console.log('🚀 [PROFILE_MODAL_HANDLERS] About to call saveProfile...');
    console.log('🚀 [PROFILE_MODAL_HANDLERS] saveProfile type:', typeof saveProfile);
    
    try {
      const success = await saveProfile(user.id, {
        avatar_url: selectedAvatar || '',
        username: trimmedUsername || `user_${user.id.slice(0, 8)}`,
        display_name: trimmedDisplayName || 'New User',
      });

      console.log('🚀 [PROFILE_MODAL_HANDLERS] Save completed, success:', success);

      if (success && mountedRef.current) {
        console.log('🚀 [PROFILE_MODAL_HANDLERS] Save successful, closing modal');
        onOpenChange(false);
      } else {
        console.log('🚀 [PROFILE_MODAL_HANDLERS] Save failed or component unmounted');
      }
    } catch (error) {
      console.error('🚀 [PROFILE_MODAL_HANDLERS] Error in handleSave:', error);
    }
  }, [user?.id, selectedAvatar, username, displayName, saving, saveProfile, onOpenChange, mountedRef]);

  const handleAvatarClick = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL_HANDLERS] Avatar clicked, opening avatar modal');
    setAvatarModalOpen(true);
  }, [setAvatarModalOpen, mountedRef]);

  const handleAvatarSelection = useCallback((avatarUrl: string) => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL_HANDLERS] ===== AVATAR SELECTED =====');
    console.log('🎭 [PROFILE_MODAL_HANDLERS] New avatar URL:', avatarUrl);
    console.log('🎭 [PROFILE_MODAL_HANDLERS] Previous avatar:', selectedAvatar);
    
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
    
    console.log('🎭 [PROFILE_MODAL_HANDLERS] Avatar state should be updated to:', avatarUrl);
  }, [selectedAvatar, setSelectedAvatar, setAvatarModalOpen, mountedRef]);

  const handleCancel = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL_HANDLERS] Cancel clicked from content');
    onOpenChange(false);
  }, [onOpenChange, mountedRef]);

  return {
    handleSave,
    handleAvatarClick,
    handleAvatarSelection,
    handleCancel,
    saving
  };
};
