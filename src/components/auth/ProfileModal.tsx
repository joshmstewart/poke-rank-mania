import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { User, Save, Loader2 } from 'lucide-react';
import { 
  getProfile, 
  updateProfile, 
  type Profile
} from '@/services/profileService';

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

  console.log('🎯 [PROFILE_MODAL_DETAILED] ===========================================');
  console.log('🎯 [PROFILE_MODAL_DETAILED] Component render:', {
    modalOpen: open,
    userId: user?.id,
    userPhone: user?.phone,
    userEmail: user?.email,
    loading,
    saving,
    profileExists: !!profile,
    displayName,
    username,
    selectedAvatar
  });

  console.log('🎯 [PROFILE_MODAL_DETAILED] useEffect dependencies check:', {
    open,
    'user?.id': user?.id,
    'typeof user?.id': typeof user?.id,
    'user exists': !!user,
    'user object': user
  });

  // Simplified useEffect with better dependency tracking
  useEffect(() => {
    console.log('🎯 [PROFILE_MODAL_DETAILED] ===== useEffect TRIGGERED =====');
    console.log('🎯 [PROFILE_MODAL_DETAILED] useEffect triggered with:', {
      open,
      userId: user?.id,
      hasUser: !!user,
      'user?.id truthy': !!user?.id,
      'open && user?.id': open && !!user?.id
    });

    // Reset loading when modal opens
    if (open) {
      console.log('🎯 [PROFILE_MODAL_DETAILED] Modal opened - starting load process');
      setLoading(true);
      
      if (user?.id) {
        console.log('🎯 [PROFILE_MODAL_DETAILED] ✅ CONDITIONS MET - calling loadProfile()');
        loadProfile();
      } else {
        console.log('🎯 [PROFILE_MODAL_DETAILED] ❌ NO USER ID - setting loading to false');
        setLoading(false);
      }
    } else {
      console.log('🎯 [PROFILE_MODAL_DETAILED] Modal closed, resetting state');
      setLoading(true);
      setProfile(null);
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
    }
  }, [open, user?.id]); // Simplified dependencies

  const loadProfile = async () => {
    console.log('🎯 [PROFILE_MODAL_DETAILED] ===== loadProfile() START =====');
    
    if (!user?.id) {
      console.log('🎯 [PROFILE_MODAL_DETAILED] No user ID in loadProfile, exiting early');
      setLoading(false);
      return;
    }
    
    console.log('🎯 [PROFILE_MODAL_DETAILED] Starting profile load for user:', user.id);
    console.log('🎯 [PROFILE_MODAL_DETAILED] User object details:', {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullUserObject: user
    });
    
    try {
      console.log('🎯 [PROFILE_MODAL_DETAILED] About to call getProfile()...');
      const profileData = await getProfile(user.id);
      console.log('🎯 [PROFILE_MODAL_DETAILED] getProfile() returned:', profileData);
      
      if (profileData) {
        console.log('🎯 [PROFILE_MODAL_DETAILED] Profile data found, setting state:', {
          avatar_url: profileData.avatar_url,
          username: profileData.username,
          display_name: profileData.display_name
        });
        
        setProfile(profileData);
        setSelectedAvatar(profileData.avatar_url || '');
        setUsername(profileData.username || '');
        setDisplayName(profileData.display_name || '');
        
        console.log('🎯 [PROFILE_MODAL_DETAILED] State set successfully');
      } else {
        console.log('🎯 [PROFILE_MODAL_DETAILED] No profile found, generating defaults');
        
        const defaultDisplayName = user.phone ? `User ${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'New User';
        const defaultUsername = user.phone ? `user_${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'new_user';
        
        console.log('🎯 [PROFILE_MODAL_DETAILED] Generated defaults:', {
          defaultDisplayName,
          defaultUsername
        });
        
        setSelectedAvatar('');
        setUsername(defaultUsername);
        setDisplayName(defaultDisplayName);
        
        console.log('🎯 [PROFILE_MODAL_DETAILED] Default state set successfully');
      }
    } catch (error) {
      console.error('🎯 [PROFILE_MODAL_DETAILED] Error in loadProfile:', error);
      console.error('🎯 [PROFILE_MODAL_DETAILED] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const defaultDisplayName = user.phone ? `User ${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'New User';
      const defaultUsername = user.phone ? `user_${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'new_user';
      
      console.log('🎯 [PROFILE_MODAL_DETAILED] Setting fallback defaults due to error');
      
      setSelectedAvatar('');
      setUsername(defaultUsername);
      setDisplayName(defaultDisplayName);
      
      toast({
        title: 'Profile Load Error',
        description: 'Could not load profile. Using defaults.',
        variant: 'destructive',
      });
    } finally {
      console.log('🎯 [PROFILE_MODAL_DETAILED] Setting loading to false in finally block');
      setLoading(false);
      console.log('🎯 [PROFILE_MODAL_DETAILED] ===== loadProfile() END =====');
    }
  };

  const handleSave = async () => {
    console.log('🎯 [PROFILE_MODAL_DETAILED] handleSave() called');
    
    if (!user?.id) {
      console.log('🎯 [PROFILE_MODAL_DETAILED] No user ID for save operation');
      return;
    }

    setSaving(true);
    console.log('🎯 [PROFILE_MODAL_DETAILED] Saving profile with data:', {
      avatar_url: selectedAvatar,
      username: username.trim(),
      display_name: displayName.trim()
    });
    
    try {
      const success = await updateProfile(user.id, {
        avatar_url: selectedAvatar,
        username: username.trim(),
        display_name: displayName.trim(),
      });

      console.log('🎯 [PROFILE_MODAL_DETAILED] Update result:', success);

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
      console.error('🎯 [PROFILE_MODAL_DETAILED] Error saving profile:', error);
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
    console.log('🎯 [PROFILE_MODAL_DETAILED] No user, returning null');
    return null;
  }

  console.log('🎯 [PROFILE_MODAL_DETAILED] About to render modal with loading state:', loading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Trainer Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedAvatar} alt="Selected avatar" />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Current Avatar</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAvatar ? 'Custom Avatar' : 'No avatar selected'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your trainer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar-url">Avatar URL (Optional)</Label>
              <Input
                id="avatar-url"
                value={selectedAvatar}
                onChange={(e) => setSelectedAvatar(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
              <p className="text-sm text-muted-foreground">
                Enter a URL to an image you'd like to use as your avatar
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
