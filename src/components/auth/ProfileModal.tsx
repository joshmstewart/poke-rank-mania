
import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';
import { ProfileModalHeader } from './ProfileModalHeader';
import { ProfileModalContent } from './ProfileModalContent';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { AuthMethodsManager } from './AuthMethodsManager';
import { useProfileFormState } from './hooks/useProfileFormState';
import { useProfileCache } from './hooks/useProfileCache';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { getProfileFromCache, prefetchProfile } = useProfileCache();
  
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

  // Load current profile data when modal opens
  useEffect(() => {
    if (open && user?.id && mountedRef.current) {
      console.log('🎭 [PROFILE_MODAL] Loading current profile data for modal');
      
      // First try to get from cache
      let currentProfile = getProfileFromCache(user.id);
      
      if (currentProfile) {
        console.log('🎭 [PROFILE_MODAL] Setting form with cached profile:', currentProfile);
        setSelectedAvatar(currentProfile.avatar_url || '');
        setUsername(currentProfile.username || '');
        setDisplayName(currentProfile.display_name || '');
      } else {
        // If no cache, fetch fresh data
        console.log('🎭 [PROFILE_MODAL] No cached profile, fetching fresh data');
        prefetchProfile(user.id).then(() => {
          const freshProfile = getProfileFromCache(user.id);
          if (freshProfile && mountedRef.current) {
            console.log('🎭 [PROFILE_MODAL] Setting form with fresh profile:', freshProfile);
            setSelectedAvatar(freshProfile.avatar_url || '');
            setUsername(freshProfile.username || '');
            setDisplayName(freshProfile.display_name || '');
          }
        });
      }
    }
  }, [open, user?.id, getProfileFromCache, prefetchProfile, setSelectedAvatar, setUsername, setDisplayName, mountedRef]);

  const handleAvatarClick = () => {
    if (!mountedRef.current) return;
    setAvatarModalOpen(true);
  };

  const handleAvatarSelection = (avatarUrl: string) => {
    if (!mountedRef.current) return;
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
  };

  const handleCancel = () => {
    if (!mountedRef.current) return;
    onOpenChange(false);
  };

  const handleSaveSuccess = () => {
    if (!mountedRef.current) return;
    onOpenChange(false);
  };

  if (!user?.id) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <ProfileModalHeader />
          
          <div className="space-y-6">
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
            
            <AuthMethodsManager />
          </div>
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
