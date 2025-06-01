
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

  console.log('🎯 [PROFILE_MODAL_DEBUG] ===== COMPONENT RENDER =====');
  console.log('🎯 [PROFILE_MODAL_DEBUG] Modal open:', open);
  console.log('🎯 [PROFILE_MODAL_DEBUG] User ID:', user?.id);
  console.log('🎯 [PROFILE_MODAL_DEBUG] Loading state:', loading);

  useEffect(() => {
    console.log('🎯 [PROFILE_MODAL_DEBUG] ===== useEffect TRIGGERED =====');
    console.log('🎯 [PROFILE_MODAL_DEBUG] Effect dependencies:', { open, userId: user?.id });
    
    const loadProfileWithErrorHandling = async () => {
      console.log('🎯 [PROFILE_MODAL_DEBUG] ===== loadProfileWithErrorHandling START =====');
      
      if (!user?.id) {
        console.log('🎯 [PROFILE_MODAL_DEBUG] No user ID, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        console.log('🎯 [PROFILE_MODAL_DEBUG] About to call getProfile with ID:', user.id);
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
          const defaultDisplayName = user.phone ? `User ${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'New User';
          const defaultUsername = user.phone ? `user_${user.phone.slice(-4)}` : user.email ? user.email.split('@')[0] : 'new_user';
          
          setSelectedAvatar('');
          setUsername(defaultUsername);
          setDisplayName(defaultDisplayName);
          console.log('🎯 [PROFILE_MODAL_DEBUG] Defaults set:', { defaultDisplayName, defaultUsername });
        }
        
      } catch (error) {
        console.error('🎯 [PROFILE_MODAL_DEBUG] ===== ERROR IN loadProfileWithErrorHandling =====');
        console.error('🎯 [PROFILE_MODAL_DEBUG] Error:', error);
        console.error('🎯 [PROFILE_MODAL_DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('🎯 [PROFILE_MODAL_DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack');
        
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
        console.log('🎯 [PROFILE_MODAL_DEBUG] ===== loadProfileWithErrorHandling END =====');
      }
    };

    if (open) {
      console.log('🎯 [PROFILE_MODAL_DEBUG] Modal is open, starting load...');
      setLoading(true);
      loadProfileWithErrorHandling();
    } else {
      console.log('🎯 [PROFILE_MODAL_DEBUG] Modal closed, resetting state');
      setLoading(true);
      setProfile(null);
      setSelectedAvatar('');
      setUsername('');
      setDisplayName('');
    }
  }, [open, user?.id]);

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
