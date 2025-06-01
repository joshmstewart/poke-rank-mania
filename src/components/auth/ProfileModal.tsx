
import React, { useState, useEffect } from 'react';
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  console.log('🎯 [PROFILE_MODAL] === PROFILE MODAL RENDER ===');
  console.log('🎯 [PROFILE_MODAL] Modal open:', open);
  console.log('🎯 [PROFILE_MODAL] User ID:', user?.id);
  console.log('🎯 [PROFILE_MODAL] Loading state:', loading);

  useEffect(() => {
    console.log('🎯 [PROFILE_MODAL] === EFFECT TRIGGERED ===');
    console.log('🎯 [PROFILE_MODAL] Effect conditions - open:', open, 'user?.id:', user?.id);

    if (!open) {
      console.log('🎯 [PROFILE_MODAL] Modal not open, resetting state...');
      setLoading(false);
      setProfile(null);
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
      return;
    }

    if (!user?.id) {
      console.log('🎯 [PROFILE_MODAL] No user ID, skipping load');
      setLoading(false);
      return;
    }

    console.log('🎯 [PROFILE_MODAL] Starting profile load...');
    setLoading(true);

    const loadProfile = async () => {
      try {
        console.log('🎯 [PROFILE_MODAL] About to call getProfile service...');
        const result = await getProfile(user.id);
        console.log('🎯 [PROFILE_MODAL] Profile result:', result);
        
        if (result) {
          console.log('🎯 [PROFILE_MODAL] Setting profile data from result...');
          setProfile(result);
          setSelectedAvatar(result.avatar_url || '');
          setUsername(result.username || '');
          setDisplayName(result.display_name || '');
        } else {
          console.log('🎯 [PROFILE_MODAL] No profile found, setting defaults...');
          
          // Create better defaults for phone users
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
          
          setProfile(null);
          setSelectedAvatar('');
          setUsername(defaultUsername);
          setDisplayName(defaultDisplayName);
        }
        
      } catch (error) {
        console.error('🎯 [PROFILE_MODAL] Error loading profile:', error);
        
        // Set defaults on error
        const defaultDisplayName = user.phone ? `User ${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'New User';
        const defaultUsername = user.phone ? `user_${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'new_user';
        
        setProfile(null);
        setSelectedAvatar('');
        setUsername(defaultUsername);
        setDisplayName(defaultDisplayName);
        
        toast({
          title: 'Profile Load Error',
          description: 'Could not load profile. Using defaults.',
          variant: 'destructive',
        });
      } finally {
        console.log('🎯 [PROFILE_MODAL] Setting loading to false - profile load complete');
        setLoading(false);
      }
    };

    loadProfile();
  }, [open, user?.id, user?.email, user?.phone]);

  const handleSave = async () => {
    console.log('🎯 [PROFILE_MODAL] Saving profile');
    
    if (!user?.id) {
      console.log('🎯 [PROFILE_MODAL] No user ID for save');
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
      console.error('🎯 [PROFILE_MODAL] Error saving profile:', error);
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
    console.log('🎯 [PROFILE_MODAL] No user, returning null');
    return null;
  }

  console.log('🎯 [PROFILE_MODAL] About to render modal with loading state:', loading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <ProfileModalHeader />
        <ProfileModalContent
          loading={loading}
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
