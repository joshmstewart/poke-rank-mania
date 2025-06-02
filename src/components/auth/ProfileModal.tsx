
import React, { useEffect, useRef } from 'react';
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
  const { getProfileFromCache } = useProfileCache();
  const loadingRef = useRef(false);
  
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

  // Load profile data when modal opens - simplified approach
  useEffect(() => {
    if (open && user?.id && mountedRef.current && !loadingRef.current) {
      console.log('🎭 [PROFILE_MODAL] ===== MODAL OPENED - LOADING DATA =====');
      loadingRef.current = true;
      
      // Get existing cached profile data
      const cachedProfile = getProfileFromCache(user.id);
      
      if (cachedProfile && mountedRef.current) {
        console.log('🎭 [PROFILE_MODAL] Setting modal form with cached profile:', {
          avatar: cachedProfile.avatar_url,
          username: cachedProfile.username,
          displayName: cachedProfile.display_name
        });
        
        setSelectedAvatar(cachedProfile.avatar_url || '');
        setUsername(cachedProfile.username || '');
        setDisplayName(cachedProfile.display_name || '');
      } else {
        console.log('🎭 [PROFILE_MODAL] No cached profile found, using defaults');
        setSelectedAvatar('');
        setUsername('');
        setDisplayName('');
      }
      
      loadingRef.current = false;
    }

    // Reset loading flag when modal closes
    if (!open) {
      loadingRef.current = false;
    }
  }, [open, user?.id, getProfileFromCache, setSelectedAvatar, setUsername, setDisplayName, mountedRef]);

  const handleAvatarClick = () => {
    if (!mountedRef.current) return;
    setAvatarModalOpen(true);
  };

  const handleAvatarSelection = (avatarUrl: string) => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL] Avatar selected in modal:', avatarUrl);
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
  };

  const handleCancel = () => {
    if (!mountedRef.current) return;
    onOpenChange(false);
  };

  const handleSaveSuccess = () => {
    if (!mountedRef.current) return;
    console.log('🎭 [PROFILE_MODAL] Save successful - closing modal');
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
