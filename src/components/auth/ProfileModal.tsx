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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  console.log('🎯 [PROFILE_MODAL_DEBUG] ===== COMPONENT RENDER =====');
  console.log('🎯 [PROFILE_MODAL_DEBUG] Modal open:', open);
  console.log('🎯 [PROFILE_MODAL_DEBUG] User ID:', user?.id);
  console.log('🎯 [PROFILE_MODAL_DEBUG] User email:', user?.email);
  console.log('🎯 [PROFILE_MODAL_DEBUG] User phone:', user?.phone);
  console.log('🎯 [PROFILE_MODAL_DEBUG] Loading state:', loading);
  console.log('🎯 [PROFILE_MODAL_DEBUG] Import check - getProfile function:', typeof getProfile);

  useEffect(() => {
    console.log('🎯 [PROFILE_MODAL_DEBUG] ===== useEffect TRIGGERED =====');
    console.log('🎯 [PROFILE_MODAL_DEBUG] Effect dependencies:', { open, userId: user?.id });
    
    const loadProfile = async () => {
      console.log('🎯 [PROFILE_MODAL_DEBUG] ===== loadProfile START =====');
      
      if (!user?.id) {
        console.log('🎯 [PROFILE_MODAL_DEBUG] No user ID, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        console.log('🎯 [PROFILE_MODAL_DEBUG] About to call getProfile with ID:', user.id);
        console.log('🎯 [PROFILE_MODAL_DEBUG] User object details:', {
          id: user.id,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata
        });
        console.log('🎯 [PROFILE_MODAL_DEBUG] Calling getProfile...');
        
        const result = await getProfile(user.id);
        
        console.log('🎯 [PROFILE_MODAL_DEBUG] ===== getProfile COMPLETED =====');
        console.log('🎯 [PROFILE_MODAL_DEBUG] Result received:', result);
        console.log('🎯 [PROFILE_MODAL_DEBUG] Result type:', typeof result);
        console.log('🎯 [PROFILE_MODAL_DEBUG] Result is null:', result === null);
        console.log('🎯 [PROFILE_MODAL_DEBUG] Result is undefined:', result === undefined);
        
        if (result) {
          console.log('🎯 [PROFILE_MODAL_DEBUG] Setting profile data...');
          setProfile(result);
          setSelectedAvatar(result.avatar_url || '');
          setUsername(result.username || '');
          setDisplayName(result.display_name || '');
          console.log('🎯 [PROFILE_MODAL_DEBUG] Profile data set successfully');
        } else {
          console.log('🎯 [PROFILE_MODAL_DEBUG] No profile found, setting defaults...');
          
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
          
          setSelectedAvatar('');
          setUsername(defaultUsername);
          setDisplayName(defaultDisplayName);
          console.log('🎯 [PROFILE_MODAL_DEBUG] Defaults set:', { defaultDisplayName, defaultUsername });
        }
        
      } catch (error) {
        console.error('🎯 [PROFILE_MODAL_DEBUG] ===== ERROR IN loadProfile =====');
        console.error('🎯 [PROFILE_MODAL_DEBUG] Error:', error);
        console.error('🎯 [PROFILE_MODAL_DEBUG] Error type:', typeof error);
        console.error('🎯 [PROFILE_MODAL_DEBUG] Error message:', error?.message);
        console.error('🎯 [PROFILE_MODAL_DEBUG] Error stack:', error?.stack);
        
        // Set defaults on error
        const defaultDisplayName = user.phone ? `User ${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'New User';
        const defaultUsername = user.phone ? `user_${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'new_user';
        
        setSelectedAvatar('');
        setUsername(defaultUsername);
        setDisplayName(defaultDisplayName);
        
        toast({
          title: 'Profile Load Error',
          description: 'Could not load profile. Using defaults.',
          variant: 'destructive',
        });
      } finally {
        console.log('🎯 [PROFILE_MODAL_DEBUG] Setting loading to false in finally block');
        setLoading(false);
        console.log('🎯 [PROFILE_MODAL_DEBUG] ===== loadProfile END =====');
      }
    };

    if (open) {
      console.log('🎯 [PROFILE_MODAL_DEBUG] Modal is open, starting load...');
      setLoading(true);
      loadProfile();
    } else {
      console.log('🎯 [PROFILE_MODAL_DEBUG] Modal closed, resetting state');
      setLoading(true);
      setProfile(null);
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
    }
  }, [open, user?.id, user?.email, user?.phone]);

  const handleSave = async () => {
    console.log('🎯 [PROFILE_MODAL_DEBUG] handleSave called');
    
    if (!user?.id) {
      console.log('🎯 [PROFILE_MODAL_DEBUG] No user ID for save');
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
      console.error('🎯 [PROFILE_MODAL_DEBUG] Error saving profile:', error);
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
    console.log('🎯 [PROFILE_MODAL_DEBUG] No user, returning null');
    return null;
  }

  console.log('🎯 [PROFILE_MODAL_DEBUG] About to render modal, loading:', loading);

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
