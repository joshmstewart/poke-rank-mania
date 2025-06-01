
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { updateProfile } from '@/services/profile/updateProfile';
import { ProfileModalHeader } from './ProfileModalHeader';
import { ProfileModalContent } from './ProfileModalContent';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { useProfileCache } from './hooks/useProfileCache';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { getProfileFromCache, prefetchProfile, invalidateCache } = useProfileCache();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [modalInstanceId] = useState(`modal-${Date.now()}`);

  console.log('🎭 [PROFILE_MODAL] ===== MODAL RENDER =====');
  console.log('🎭 [PROFILE_MODAL] Modal instance ID:', modalInstanceId);
  console.log('🎭 [PROFILE_MODAL] Modal open:', open);
  console.log('🎭 [PROFILE_MODAL] User ID:', user?.id);
  console.log('🎭 [PROFILE_MODAL] Saving state:', saving);

  // Initialize form with cached data immediately when modal opens
  useEffect(() => {
    console.log('🎭 [PROFILE_MODAL] ===== INITIALIZATION EFFECT =====');
    console.log('🎭 [PROFILE_MODAL] Modal instance ID:', modalInstanceId);
    console.log('🎭 [PROFILE_MODAL] Effect triggered - open:', open, 'user.id:', user?.id);
    
    if (open && user?.id) {
      // Get cached profile data
      const cachedProfile = getProfileFromCache(user.id);
      console.log('🎭 [PROFILE_MODAL] Cached profile data:', cachedProfile);
      
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
      
      // Use cached data if available, otherwise use defaults
      const avatarToSet = cachedProfile?.avatar_url || '';
      const usernameToSet = cachedProfile?.username || defaultUsername;
      const displayNameToSet = cachedProfile?.display_name || defaultDisplayName;
      
      console.log('🎭 [PROFILE_MODAL] Setting form values:', {
        avatar: avatarToSet,
        username: usernameToSet,
        displayName: displayNameToSet
      });
      
      setSelectedAvatar(avatarToSet);
      setUsername(usernameToSet);
      setDisplayName(displayNameToSet);
      
      // Refresh cache in background (non-blocking) - but only if we don't have fresh data
      if (!cachedProfile) {
        console.log('🎭 [PROFILE_MODAL] No cached data, prefetching...');
        prefetchProfile(user.id);
      } else {
        console.log('🎭 [PROFILE_MODAL] Using cached data, skipping prefetch');
      }
    }
    
    if (!open) {
      console.log('🎭 [PROFILE_MODAL] Modal closed, resetting form');
      // Reset form when modal closes
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
      setSaving(false); // Make sure saving state is reset
    }
  }, [open, user?.id, user?.email, user?.phone]); // Removed getProfileFromCache and prefetchProfile from deps

  const handleSave = async () => {
    if (!user?.id) {
      console.log('❌ [PROFILE_SAVE] No user ID available for save');
      toast({
        title: 'Authentication Error',
        description: 'User not authenticated. Please log in again.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🚀 [PROFILE_SAVE] ===== STARTING SAVE OPERATION =====');
    console.log('🚀 [PROFILE_SAVE] Modal instance ID:', modalInstanceId);
    console.log('🚀 [PROFILE_SAVE] User ID:', user.id);
    console.log('🚀 [PROFILE_SAVE] Selected Avatar:', selectedAvatar);
    console.log('🚀 [PROFILE_SAVE] Username:', username.trim());
    console.log('🚀 [PROFILE_SAVE] Display Name:', displayName.trim());

    // Validate input
    if (!username.trim() || !displayName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Username and display name are required.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🚀 [PROFILE_SAVE] Setting saving state to true');
    setSaving(true);
    
    try {
      console.log('🚀 [PROFILE_SAVE] About to call updateProfile function...');
      
      const updateData = {
        avatar_url: selectedAvatar,
        username: username.trim(),
        display_name: displayName.trim(),
      };
      
      console.log('🚀 [PROFILE_SAVE] Update data prepared:', updateData);
      console.log('🚀 [PROFILE_SAVE] Calling updateProfile with userID:', user.id);
      
      const success = await updateProfile(user.id, updateData);
      
      console.log('🚀 [PROFILE_SAVE] updateProfile returned:', success);

      if (success) {
        console.log('🚀 [PROFILE_SAVE] Success! Invalidating cache and showing success...');
        
        // Invalidate the cache so next time we fetch fresh data
        invalidateCache(user.id);
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        
        console.log('🚀 [PROFILE_SAVE] Toast shown, about to close modal');
        console.log('🚀 [PROFILE_SAVE] Setting saving to false and closing modal');
        setSaving(false);
        onOpenChange(false);
        console.log('🚀 [PROFILE_SAVE] Modal close triggered');
      } else {
        console.log('❌ [PROFILE_SAVE] Update failed - updateProfile returned false');
        setSaving(false);
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please check the console for details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ [PROFILE_SAVE] Exception during save:', error);
      console.error('❌ [PROFILE_SAVE] Error details:', JSON.stringify(error, null, 2));
      setSaving(false);
      toast({
        title: 'Save Error',
        description: `An error occurred while saving your profile: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
    
    console.log('🚀 [PROFILE_SAVE] ===== SAVE OPERATION COMPLETE =====');
  };

  const handleAvatarClick = () => {
    console.log('🎭 [PROFILE_MODAL] Avatar clicked, opening avatar modal');
    setAvatarModalOpen(true);
  };

  const handleAvatarSelection = (avatarUrl: string) => {
    console.log('🎭 [PROFILE_MODAL] Avatar selected:', avatarUrl);
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
  };

  if (!user?.id) {
    console.log('🎭 [PROFILE_MODAL] No user ID, returning null');
    return null;
  }

  console.log('🎭 [PROFILE_MODAL] About to render modal with saving state:', saving);

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
            onCancel={() => onOpenChange(false)}
            onSave={handleSave}
            onAvatarClick={handleAvatarClick}
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
