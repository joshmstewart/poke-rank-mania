
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { updateProfile } from '@/services/profile';
import { ProfileModalHeader } from './ProfileModalHeader';
import { ProfileModalContent } from './ProfileModalContent';
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
    if (!user?.id) return;

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
      console.error('Error saving profile:', error);
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
    return null;
  }

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
