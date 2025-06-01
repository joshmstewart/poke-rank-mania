
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { User, Save, Loader2 } from 'lucide-react';
import { 
  getProfile, 
  updateProfile, 
  getTrainerAvatarsByGeneration, 
  getTrainerAvatarByUrl,
  type Profile,
  type TrainerAvatar 
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const trainerAvatarsByGen = getTrainerAvatarsByGeneration();

  console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ===== COMPONENT RENDER =====');
  console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Modal open:', open);
  console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] User from useAuth:', {
    hasUser: !!user,
    userId: user?.id || 'NO_USER_ID',
    userEmail: user?.email || 'NO_EMAIL',
    userPhone: user?.phone || 'NO_PHONE',
    loading,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (open && user?.id) {
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Modal opened, loading profile for user:', user.id);
      loadProfile();
    } else if (open && !user?.id) {
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Modal opened but no user ID, setting loading to false');
      setLoading(false);
    }
  }, [open, user?.id]);

  const loadProfile = async () => {
    if (!user?.id) {
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ❌ No user ID available for profile loading');
      setLoading(false);
      return;
    }
    
    console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Starting profile load for user ID:', user.id);
    setLoading(true);
    
    try {
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Calling getProfile with user ID:', user.id);
      
      // Add a timeout to prevent infinite loading
      const profilePromise = getProfile(user.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 10000)
      );
      
      const profileData = await Promise.race([profilePromise, timeoutPromise]) as Profile | null;
      
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Profile data received:', profileData);
      
      if (profileData) {
        setProfile(profileData);
        setSelectedAvatar(profileData.avatar_url || '');
        setUsername(profileData.username || '');
        setDisplayName(profileData.display_name || '');
        console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ✅ Profile loaded successfully');
      } else {
        console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] No profile data found, creating default profile');
        // Create a default profile object for new users
        const defaultProfile: Profile = {
          id: user.id,
          email: user.email || undefined,
          display_name: user.phone ? `User ${user.phone.slice(-4)}` : 'New User',
          avatar_url: '',
          username: user.phone ? `user_${user.phone.slice(-4)}` : 'new_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProfile(defaultProfile);
        setSelectedAvatar('');
        setUsername(defaultProfile.username || '');
        setDisplayName(defaultProfile.display_name || '');
        console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ✅ Default profile created for new user');
      }
    } catch (error) {
      console.error('🎯🎯🎯 [PROFILE_MODAL_FIXED] ❌ Error loading profile:', error);
      
      // Create a fallback profile even if there's an error
      const fallbackProfile: Profile = {
        id: user.id,
        email: user.email || undefined,
        display_name: user.phone ? `User ${user.phone.slice(-4)}` : 'User',
        avatar_url: '',
        username: user.phone ? `user_${user.phone.slice(-4)}` : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setProfile(fallbackProfile);
      setSelectedAvatar('');
      setUsername(fallbackProfile.username || '');
      setDisplayName(fallbackProfile.display_name || '');
      
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ⚠️ Using fallback profile due to error');
      
      toast({
        title: 'Profile Load Warning',
        description: 'Could not load existing profile. You can still update your information.',
        variant: 'default',
      });
    } finally {
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Setting loading to false in finally block');
      setLoading(false);
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Profile loading completed');
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ❌ No user ID available for profile save');
      return;
    }

    console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Starting profile save for user:', user.id);
    setSaving(true);
    
    try {
      const success = await updateProfile(user.id, {
        avatar_url: selectedAvatar,
        username: username.trim(),
        display_name: displayName.trim(),
      });

      if (success) {
        console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ✅ Profile saved successfully');
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        onOpenChange(false);
      } else {
        console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ❌ Profile save failed');
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('🎯🎯🎯 [PROFILE_MODAL_FIXED] ❌ Error saving profile:', error);
      toast({
        title: 'Save Error',
        description: 'An error occurred while saving your profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (avatar: TrainerAvatar) => {
    console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Avatar selected:', avatar.name);
    setSelectedAvatar(avatar.url);
  };

  const getGenerationName = (gen: number): string => {
    const genNames: Record<number, string> = {
      1: 'Generation I (Kanto)',
      2: 'Generation II (Johto)', 
      3: 'Generation III (Hoenn)',
      4: 'Generation IV (Sinnoh)',
      5: 'Generation V (Unova)',
    };
    return genNames[gen] || `Generation ${gen}`;
  };

  if (!user?.id) {
    console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] ❌ No user ID, not rendering modal');
    return null;
  }

  if (loading) {
    console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Rendering loading state');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  console.log('🎯🎯🎯 [PROFILE_MODAL_FIXED] Rendering full profile modal');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Trainer Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Avatar Preview */}
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
                {selectedAvatar ? getTrainerAvatarByUrl(selectedAvatar)?.name || 'Custom Avatar' : 'No avatar selected'}
              </p>
            </div>
          </div>

          {/* Profile Information */}
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

          {/* Avatar Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Your Trainer Avatar</h3>
            
            <Tabs defaultValue="1" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {Object.keys(trainerAvatarsByGen).map((gen) => (
                  <TabsTrigger key={gen} value={gen}>
                    Gen {gen}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Object.entries(trainerAvatarsByGen).map(([gen, avatars]) => (
                <TabsContent key={gen} value={gen} className="space-y-4">
                  <h4 className="font-medium">{getGenerationName(Number(gen))}</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => handleAvatarSelect(avatar)}
                        className={`p-3 rounded-lg border-2 transition-all hover:bg-muted ${
                          selectedAvatar === avatar.url 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border'
                        }`}
                      >
                        <Avatar className="h-16 w-16 mx-auto mb-2">
                          <AvatarImage src={avatar.url} alt={avatar.name} />
                          <AvatarFallback>{avatar.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium">{avatar.name}</p>
                        <p className="text-xs text-muted-foreground">{avatar.category}</p>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Action Buttons */}
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
      </DialogContent>
    </Dialog>
  );
};
