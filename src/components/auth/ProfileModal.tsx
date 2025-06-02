
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

  // Load current profile data when modal opens - CRITICAL FIX
  useEffect(() => {
    if (open && user?.id && mountedRef.current) {
      console.log('🎭 [PROFILE_MODAL] ===== MODAL OPENED - LOADING CURRENT DATA =====');
      
      // Always fetch fresh data when modal opens to ensure we have latest
      const loadCurrentData = async () => {
        console.log('🎭 [PROFILE_MODAL] Fetching fresh profile data for modal...');
        
        try {
          // Fetch fresh profile data
          await prefetchProfile(user.id);
          const currentProfile = getProfileFromCache(user.id);
          
          if (currentProfile && mountedRef.current) {
            console.log('🎭 [PROFILE_MODAL] Setting modal form with current profile:', {
              avatar: currentProfile.avatar_url,
              username: currentProfile.username,
              displayName: currentProfile.display_name
            });
            
            setSelectedAvatar(currentProfile.avatar_url || '');
            setUsername(currentProfile.username || '');
            setDisplayName(currentProfile.display_name || '');
          } else {
            console.log('🎭 [PROFILE_MODAL] No current profile found, using defaults');
            setSelectedAvatar('');
            setUsername('');
            setDisplayName('');
          }
        } catch (error) {
          console.error('🎭 [PROFILE_MODAL] Error loading current profile:', error);
        }
      };
      
      loadCurrentData();
    }
  }, [open, user?.id, getProfileFromCache, prefetchProfile, setSelectedAvatar, setUsername, setDisplayName, mountedRef]);

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
