
import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';
import { ProfileModalHeader } from './ProfileModalHeader';
import { ProfileModalContent } from './ProfileModalContent';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { useProfileFormState } from './hooks/useProfileFormState';
import { useProfileChangeDetection } from './hooks/useProfileChangeDetection';
import { useProfileModalHandlers } from './hooks/useProfileModalHandlers';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  
  const {
    selectedAvatar,
    setSelectedAvatar,
    username,
    setUsername,
    displayName,
    setDisplayName,
    avatarModalOpen,
    setAvatarModalOpen,
    initialValues,
    mountedRef
  } = useProfileFormState(open);

  const { hasChanges } = useProfileChangeDetection(
    selectedAvatar,
    username,
    displayName,
    initialValues
  );

  const {
    handleSave,
    handleAvatarClick,
    handleAvatarSelection,
    handleCancel,
    saving
  } = useProfileModalHandlers(
    selectedAvatar,
    setSelectedAvatar,
    username,
    displayName,
    setAvatarModalOpen,
    onOpenChange,
    mountedRef
  );

  console.log('🎭 [PROFILE_MODAL] Render - Open:', open, 'Saving:', saving, 'User:', !!user);
  console.log('🎭 [PROFILE_MODAL] saveProfile function type:', typeof handleSave);
  console.log('🎭 [PROFILE_MODAL] Form state:', { selectedAvatar, username, displayName });

  // Debug effect to track saving state changes in modal
  useEffect(() => {
    console.log('🎭 [PROFILE_MODAL] Saving state effect triggered, saving:', saving);
  }, [saving]);

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
