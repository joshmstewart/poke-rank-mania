import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  getProfile, 
  updateProfile, 
  type Profile
} from '@/services/profile';
import { ProfileModalHeader } from './ProfileModalHeader';
import { ProfileModalContent } from './ProfileModalContent';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  console.log('🚀 [PROFILE_MODAL_NEW] === NEW APPROACH RENDER ===');
  console.log('🚀 [PROFILE_MODAL_NEW] Modal open:', open);
  console.log('🚀 [PROFILE_MODAL_NEW] User ID:', user?.id);
  console.log('🚀 [PROFILE_MODAL_NEW] Initialized:', initialized);

  // Novel approach: Initialize immediately when modal opens, no loading state
  React.useEffect(() => {
    if (open && user?.id && !initialized) {
      console.log('🚀 [PROFILE_MODAL_NEW] INITIALIZING PROFILE DATA...');
      
      // Set defaults immediately - no loading state
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
      
      setSelectedAvatar('');
      setUsername(defaultUsername);
      setDisplayName(defaultDisplayName);
      setInitialized(true);
      
      console.log('🚀 [PROFILE_MODAL_NEW] ✅ DEFAULTS SET, NOW LOADING PROFILE IN BACKGROUND...');
      
      // Load actual profile data in background, update fields if found
      getProfile(user.id).then(profile => {
        console.log('🚀 [PROFILE_MODAL_NEW] Background profile load result:', profile);
        if (profile) {
          setSelectedAvatar(profile.avatar_url || '');
          setUsername(profile.username || defaultUsername);
          setDisplayName(profile.display_name || defaultDisplayName);
          console.log('🚀 [PROFILE_MODAL_NEW] ✅ PROFILE DATA UPDATED FROM DATABASE');
        } else {
          console.log('🚀 [PROFILE_MODAL_NEW] ✅ KEEPING DEFAULTS (NO PROFILE IN DB)');
        }
      }).catch(error => {
        console.error('🚀 [PROFILE_MODAL_NEW] Background profile load error:', error);
        // Keep defaults on error
      });
    }
    
    if (!open) {
      // Reset when modal closes
      setInitialized(false);
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
    }
  }, [open, user?.id, user?.email, user?.phone, initialized]);

  const handleSave = async () => {
    console.log('🚀 [PROFILE_MODAL_NEW] Saving profile');
    
    if (!user?.id) {
      console.log('🚀 [PROFILE_MODAL_NEW] No user ID for save');
      return;
    }

    setSaving(true);
    
    try {
      const success = await updateProfile(user.id, {
        avatar_url: selectedAvatar,
        username: username.trim(),
        display_name: displayName.trim(),
      });

      if (success) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('🚀 [PROFILE_MODAL_NEW] Error saving profile:', error);
      toast({
        title: 'Save Error',
        description: 'An error occurred while saving your profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user?.id) {
    console.log('🚀 [PROFILE_MODAL_NEW] No user, returning null');
    return null;
  }

  console.log('🚀 [PROFILE_MODAL_NEW] About to render modal - NO LOADING STATE!');

  return (
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
        />
      </DialogContent>
    </Dialog>
  );
};
