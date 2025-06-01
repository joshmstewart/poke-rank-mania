
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
  const { getProfileFromCache, prefetchProfile } = useProfileCache();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // Initialize form with cached data immediately when modal opens
  useEffect(() => {
    if (open && user?.id) {
      // Get cached profile data
      const cachedProfile = getProfileFromCache(user.id);
      
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
      setSelectedAvatar(cachedProfile?.avatar_url || '');
      setUsername(cachedProfile?.username || defaultUsername);
      setDisplayName(cachedProfile?.display_name || defaultDisplayName);
      
      // Refresh cache in background (non-blocking)
      prefetchProfile(user.id);
    }
    
    if (!open) {
      // Reset form when modal closes
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
    }
  }, [open, user?.id, user?.email, user?.phone, getProfileFromCache, prefetchProfile]);

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

    setSaving(true);
    console.log('🚀 [PROFILE_SAVE] Setting saving state to true');
    
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
        console.log('🚀 [PROFILE_SAVE] Success! About to show toast and close modal...');
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        console.log('🚀 [PROFILE_SAVE] Toast shown, about to close modal');
        onOpenChange(false);
        console.log('🚀 [PROFILE_SAVE] Modal close triggered');
      } else {
        console.log('❌ [PROFILE_SAVE] Update failed - updateProfile returned false');
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please check the console for details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ [PROFILE_SAVE] Exception during save:', error);
      console.error('❌ [PROFILE_SAVE] Error details:', JSON.stringify(error, null, 2));
      toast({
        title: 'Save Error',
        description: `An error occurred while saving your profile: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      console.log('🚀 [PROFILE_SAVE] Setting saving state to false');
      setSaving(false);
      console.log('🚀 [PROFILE_SAVE] ===== SAVE OPERATION COMPLETE =====');
    }
  };

  const handleAvatarClick = () => {
    console.log('Avatar clicked, opening modal');
    setAvatarModalOpen(true);
  };

  const handleAvatarSelection = (avatarUrl: string) => {
    console.log('Avatar selected in ProfileModal:', avatarUrl);
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
  };

  if (!user?.id) {
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
