
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';
import { ProfileModalHeader } from './ProfileModalHeader';
import { ProfileModalContent } from './ProfileModalContent';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { useSimpleProfileSave } from './hooks/useSimpleProfileSave';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { saving, saveProfile } = useSimpleProfileSave();
  const mountedRef = useRef(true);
  
  // Initialize state with proper default values to prevent React queue issues
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarModalOpen, setAvatarModalOpen] = useState<boolean>(false);

  // Store initial values to calculate hasChanges
  const [initialValues, setInitialValues] = useState<{
    avatar: string;
    username: string;
    displayName: string;
  }>({
    avatar: '',
    username: '',
    displayName: ''
  });

  console.log('🎭 [PROFILE_MODAL_SIMPLE] Render - Open:', open, 'Saving:', saving, 'User:', !!user);
  console.log('🎭 [PROFILE_MODAL_SIMPLE] saveProfile function type:', typeof saveProfile);
  console.log('🎭 [PROFILE_MODAL_SIMPLE] Form state:', { selectedAvatar, username, displayName });

  // Calculate hasChanges
  const hasChanges = 
    selectedAvatar !== initialValues.avatar ||
    username.trim() !== initialValues.username ||
    displayName.trim() !== initialValues.displayName;

  console.log('🎭 [PROFILE_MODAL_SIMPLE] hasChanges calculation:', {
    hasChanges,
    selectedAvatar,
    initialAvatar: initialValues.avatar,
    username: username.trim(),
    initialUsername: initialValues.username,
    displayName: displayName.trim(),
    initialDisplayName: initialValues.displayName
  });

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      console.log('🎭 [PROFILE_MODAL_SIMPLE] Component unmounting');
      mountedRef.current = false;
    };
  }, []);

  // Debug effect to track saving state changes in modal
  useEffect(() => {
    console.log('🎭 [PROFILE_MODAL_SIMPLE] Saving state effect triggered, saving:', saving);
  }, [saving]);

  // Initialize form with default values when modal opens
  useEffect(() => {
    if (open && user && mountedRef.current) {
      console.log('🎭 [PROFILE_MODAL_SIMPLE] Initializing form for user:', user.id);
      
      // Set defaults based on user info
      let defaultDisplayName = 'New User';
      let defaultUsername = 'new_user';
      
      if (user.phone) {
        const phoneDigits = user.phone.replace(/\D/g, '');
        const lastFour = phoneDigits.slice(-4);
        defaultDisplayName = `User ${lastFour}`;
        defaultUsername = `user_${lastFour}`;
      } else if (user.email) {
        const emailPart = user.email.split('@')[0];
        defaultDisplayName = emailPart;
        defaultUsername = emailPart;
      }
      
      console.log('🎭 [PROFILE_MODAL_SIMPLE] Setting defaults:', {
        displayName: defaultDisplayName,
        username: defaultUsername
      });
      
      // Use functional updates to prevent stale state issues
      setSelectedAvatar(() => '');
      setUsername(() => defaultUsername);
      setDisplayName(() => defaultDisplayName);
      
      // Set initial values for hasChanges calculation
      setInitialValues({
        avatar: '',
        username: defaultUsername,
        displayName: defaultDisplayName
      });
    }
    
    if (!open && mountedRef.current) {
      console.log('🎭 [PROFILE_MODAL_SIMPLE] Modal closed, resetting form');
      setSelectedAvatar(() => '');
      setUsername(() => '');
      setDisplayName(() => '');
      setInitialValues({
        avatar: '',
        username: '',
        displayName: ''
      });
    }
  }, [open, user?.id, user?.email, user?.phone]);

  const handleSave = useCallback(async () => {
    console.log('🚀🚀🚀 [PROFILE_MODAL] HANDLE_SAVE CALLBACK TRIGGERED! 🚀🚀🚀');
    console.log('🚀 [PROFILE_MODAL] Component mounted:', mountedRef.current);
    console.log('🚀 [PROFILE_MODAL] Function called at:', new Date().toISOString());
    
    if (!mountedRef.current) {
      console.log('🚀 [PROFILE_MODAL] Component unmounted, skipping save');
      return;
    }

    console.log('🚀 [PROFILE_MODAL] ===== HANDLE SAVE CLICKED =====');
    console.log('🚀 [PROFILE_MODAL] User ID:', user?.id);
    console.log('🚀 [PROFILE_MODAL] Current saving state:', saving);
    console.log('🚀 [PROFILE_MODAL] Form values:', {
      avatar: selectedAvatar,
      username: username.trim(),
      displayName: displayName.trim()
    });

    if (!user?.id) {
      console.log('❌ [PROFILE_MODAL] No user ID for save');
      return;
    }

    // Validate input
    if (!username.trim() || !displayName.trim()) {
      console.log('❌ [PROFILE_MODAL] Validation failed - empty fields');
      return;
    }

    if (saving) {
      console.log('❌ [PROFILE_MODAL] Already saving, skipping');
      return;
    }

    console.log('🚀 [PROFILE_MODAL] About to call saveProfile...');
    console.log('🚀 [PROFILE_MODAL] saveProfile type:', typeof saveProfile);
    console.log('🚀 [PROFILE_MODAL] saveProfile is function:', typeof saveProfile === 'function');
    
    try {
      const success = await saveProfile(user.id, {
        avatar_url: selectedAvatar,
        username: username.trim(),
        display_name: displayName.trim(),
      });

      console.log('🚀 [PROFILE_MODAL] Save completed, success:', success);
      console.log('🚀 [PROFILE_MODAL] Current saving state after save:', saving);

      if (success && mountedRef.current) {
        console.log('🚀 [PROFILE_MODAL] Save successful, closing modal');
        onOpenChange(false);
      } else {
        console.log('🚀 [PROFILE_MODAL] Save failed or component unmounted');
      }
    } catch (error) {
      console.error('🚀 [PROFILE_MODAL] Error in handleSave:', error);
    }
  }, [user?.id, selectedAvatar, username, displayName, saving, saveProfile, onOpenChange]);

  const handleAvatarClick = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL] Avatar clicked, opening avatar modal');
    setAvatarModalOpen(true);
  }, []);

  const handleAvatarSelection = useCallback((avatarUrl: string) => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL] ===== AVATAR SELECTED =====');
    console.log('🎭 [PROFILE_MODAL] New avatar URL:', avatarUrl);
    console.log('🎭 [PROFILE_MODAL] Previous avatar:', selectedAvatar);
    
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
    
    console.log('🎭 [PROFILE_MODAL] Avatar state should be updated to:', avatarUrl);
  }, [selectedAvatar]);

  const handleCancel = useCallback(() => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL] Cancel clicked from content');
    onOpenChange(false);
  }, [onOpenChange]);

  if (!user?.id) {
    console.log('🎭 [PROFILE_MODAL] No user ID, returning null');
    return null;
  }

  console.log('🎭 [PROFILE_MODAL] About to render dialog, handleSave type:', typeof handleSave);
  console.log('🎭 [PROFILE_MODAL] handleSave reference exists:', !!handleSave);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <ProfileModalHeader />
          
          <ProfileModalContent
            loading={false}
            selectedAvatar={selectedAvatar}
            setSelectedAvatar={setSelectedAvatar}
            username={username}
            setUsername={setUsername}
            displayName={displayName}
            setDisplayName={setDisplayName}
            saving={saving}
            onCancel={handleCancel}
            onSave={handleSave}
            onAvatarClick={handleAvatarClick}
            hasChanges={hasChanges}
            user={user}
          />
        </DialogContent>
      </Dialog>

      <AvatarSelectionModal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        currentAvatar={selectedAvatar}
        onSelectAvatar={handleAvatarSelection}
      />
    </>
  );
};
