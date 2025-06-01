
import React, { useState, useEffect } from 'react';
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
  
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  console.log('🎭 [PROFILE_MODAL_SIMPLE] Render - Open:', open, 'Saving:', saving, 'User:', !!user);
  console.log('🎭 [PROFILE_MODAL_SIMPLE] saveProfile function type:', typeof saveProfile);
  console.log('🎭 [PROFILE_MODAL_SIMPLE] Form state:', { selectedAvatar, username, displayName });

  // Debug effect to track saving state changes in modal
  useEffect(() => {
    console.log('🎭 [PROFILE_MODAL_SIMPLE] Saving state effect triggered, saving:', saving);
  }, [saving]);

  // Initialize form with default values when modal opens
  useEffect(() => {
    if (open && user) {
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
      
      setSelectedAvatar('');
      setUsername(defaultUsername);
      setDisplayName(defaultDisplayName);
    }
    
    if (!open) {
      console.log('🎭 [PROFILE_MODAL_SIMPLE] Modal closed, resetting form');
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
    }
  }, [open, user?.id, user?.email, user?.phone]);

  const handleSave = async () => {
    console.log('🚀 [PROFILE_MODAL_SIMPLE] ===== HANDLE SAVE CLICKED =====');
    console.log('🚀 [PROFILE_MODAL_SIMPLE] User ID:', user?.id);
    console.log('🚀 [PROFILE_MODAL_SIMPLE] Current saving state:', saving);
    console.log('🚀 [PROFILE_MODAL_SIMPLE] Form values:', {
      avatar: selectedAvatar,
      username: username.trim(),
      displayName: displayName.trim()
    });

    if (!user?.id) {
      console.log('❌ [PROFILE_MODAL_SIMPLE] No user ID for save');
      return;
    }

    // Validate input
    if (!username.trim() || !displayName.trim()) {
      console.log('❌ [PROFILE_MODAL_SIMPLE] Validation failed - empty fields');
      return;
    }

    if (saving) {
      console.log('❌ [PROFILE_MODAL_SIMPLE] Already saving, skipping');
      return;
    }

    console.log('🚀 [PROFILE_MODAL_SIMPLE] Calling saveProfile...');
    const success = await saveProfile(user.id, {
      avatar_url: selectedAvatar,
      username: username.trim(),
      display_name: displayName.trim(),
    });

    console.log('🚀 [PROFILE_MODAL_SIMPLE] Save completed, success:', success);
    console.log('🚀 [PROFILE_MODAL_SIMPLE] Current saving state after save:', saving);

    if (success) {
      console.log('🚀 [PROFILE_MODAL_SIMPLE] Save successful, closing modal');
      onOpenChange(false);
    } else {
      console.log('🚀 [PROFILE_MODAL_SIMPLE] Save failed');
    }
  };

  const handleAvatarClick = () => {
    console.log('🎭 [PROFILE_MODAL_SIMPLE] Avatar clicked');
    setAvatarModalOpen(true);
  };

  const handleAvatarSelection = (avatarUrl: string) => {
    console.log('🎭 [PROFILE_MODAL_SIMPLE] Avatar selected:', avatarUrl);
    setSelectedAvatar(avatarUrl);
    setAvatarModalOpen(false);
  };

  if (!user?.id) {
    console.log('🎭 [PROFILE_MODAL_SIMPLE] No user ID, returning null');
    return null;
  }

  console.log('🎭 [PROFILE_MODAL_SIMPLE] About to render dialog, handleSave type:', typeof handleSave);

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
            onCancel={() => {
              console.log('🎭 [PROFILE_MODAL_SIMPLE] Cancel clicked from content');
              onOpenChange(false);
            }}
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
