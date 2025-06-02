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
  const { getProfileFromCache, prefetchProfile } = useProfileCache();
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

  // Load profile data when modal opens and set form fields
  useEffect(() => {
    if (open && user?.id && mountedRef.current && !loadingRef.current) {
      console.log('🎭 [PROFILE_MODAL] ===== MODAL OPENED - LOADING PROFILE DATA =====');
      loadingRef.current = true;
      
      const loadProfileData = async () => {
        try {
          // First check cache
          let cachedProfile = getProfileFromCache(user.id);
          
          // If no cache, fetch fresh data
          if (!cachedProfile) {
            console.log('🎭 [PROFILE_MODAL] No cached profile, fetching fresh data...');
            await prefetchProfile(user.id, false);
            cachedProfile = getProfileFromCache(user.id);
          }
          
          if (cachedProfile && mountedRef.current) {
            console.log('🎭 [PROFILE_MODAL] ✅ Setting form fields with profile data:', {
              avatar: cachedProfile.avatar_url,
              username: cachedProfile.username,
              displayName: cachedProfile.display_name
            });
            
            // Set the form fields with actual profile data
            setSelectedAvatar(cachedProfile.avatar_url || '');
            setUsername(cachedProfile.username || '');
            setDisplayName(cachedProfile.display_name || '');
          } else {
            console.log('🎭 [PROFILE_MODAL] No profile found, keeping default values');
            // Form will keep the default values set by useProfileFormState
          }
        } catch (error) {
          console.error('🎭 [PROFILE_MODAL] Error loading profile data:', error);
        } finally {
          loadingRef.current = false;
        }
      };
      
      loadProfileData();
    }

    // Reset loading flag when modal closes
    if (!open) {
      loadingRef.current = false;
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
