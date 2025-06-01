
import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';
import { ProfileModalHeader } from './ProfileModalHeader';
import { ProfileModalContent } from './ProfileModalContent';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { useProfileFormState } from './hooks/useProfileFormState';

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
    mountedRef
  } = useProfileFormState(open);

  console.log('🎭🎭🎭 [NEW_PROFILE_MODAL] Simplified render approach');
  console.log('🎭🎭🎭 [NEW_PROFILE_MODAL] Open:', open, 'User:', !!user);

  const handleAvatarClick = () => {
    if (!mountedRef.current) return;
    console.log('🎭🎭🎭 [NEW_PROFILE_MODAL] Avatar clicked');
    setAvatarModalOpen(true);
  };

  const handleAvatarSelection = (avatarUrl: string) => {
    if (!mountedRef.current) return;
    console.log('🎭🎭🎭 [NEW_PROFILE_MODAL] Avatar selected:', avatarUrl);
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
  };

  const handleCancel = () => {
    if (!mountedRef.current) return;
    console.log('🎭🎭🎭 [NEW_PROFILE_MODAL] Cancel clicked');
    onOpenChange(false);
  };

  const handleSaveSuccess = () => {
    if (!mountedRef.current) return;
    console.log('🎭🎭🎭 [NEW_PROFILE_MODAL] Save successful, closing modal');
    onOpenChange(false);
  };

  if (!user?.id) {
    console.log('🎭🎭🎭 [NEW_PROFILE_MODAL] No user ID, returning null');
    return null;
  }

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
            onCancel={handleCancel}
            onAvatarClick={handleAvatarClick}
            onSaveSuccess={handleSaveSuccess}
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
