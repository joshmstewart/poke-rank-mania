
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth/useAuth';
import { updateProfile } from '@/services/profile';
import { useProfileCache } from './hooks/useProfileCache';
import { useProfileValidation } from './hooks/useProfileValidation';

interface ProfileModalContentProps {
  loading: boolean;
  selectedAvatar: string;
  setSelectedAvatar: (avatar: string) => void;
  username: string;
  setUsername: (username: string) => void;
  displayName: string;
  setDisplayName: (displayName: string) => void;
  onCancel: () => void;
  onAvatarClick: () => void;
  onSaveSuccess: () => void;
}

export const ProfileModalContent: React.FC<ProfileModalContentProps> = ({
  loading,
  selectedAvatar,
  setSelectedAvatar,
  username,
  setUsername,
  displayName,
  setDisplayName,
  onCancel,
  onAvatarClick,
  onSaveSuccess
}) => {
  const { user } = useAuth();
  const { invalidateProfile } = useProfileCache();
  const { validationErrors, validateProfile, handleDatabaseError, clearErrors } = useProfileValidation();
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Clear errors when user starts typing
  useEffect(() => {
    if (validationErrors.username || validationErrors.displayName) {
      const timer = setTimeout(clearErrors, 3000);
      return () => clearTimeout(timer);
    }
  }, [username, displayName, validationErrors, clearErrors]);

  const handleSave = async () => {
    if (!user?.id || !mountedRef.current) return;

    // Validate before saving
    if (!validateProfile(username, displayName)) {
      return;
    }

    setIsSaving(true);
    clearErrors();

    try {
      console.log('🎭 [PROFILE_MODAL_CONTENT] Saving profile with validation...');
      
      const success = await updateProfile(user.id, {
        username: username.trim(),
        display_name: displayName.trim(),
        avatar_url: selectedAvatar,
      });

      if (success && mountedRef.current) {
        console.log('🎭 [PROFILE_MODAL_CONTENT] ✅ Profile saved successfully');
        
        // Invalidate cache to force refresh
        invalidateProfile(user.id);
        
        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: { userId: user.id, timestamp: new Date().toISOString() }
        }));
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been saved successfully.',
        });
        
        onSaveSuccess();
      } else if (mountedRef.current) {
        throw new Error('Profile update failed');
      }
    } catch (error: any) {
      console.error('🎭 [PROFILE_MODAL_CONTENT] Save error:', error);
      
      if (mountedRef.current) {
        handleDatabaseError(error);
        
        if (!validationErrors.username && !validationErrors.displayName && !validationErrors.general) {
          toast({
            title: 'Save failed',
            description: 'There was an error saving your profile. Please try again.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24 cursor-pointer" onClick={onAvatarClick}>
            <AvatarImage src={selectedAvatar} alt="Profile avatar" />
            <AvatarFallback className="text-lg">
              {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <Button
            size="sm"
            variant="outline"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
            onClick={onAvatarClick}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={onAvatarClick}>
          Change Avatar
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className={validationErrors.username ? 'border-red-500' : ''}
          />
          {validationErrors.username && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.username}</p>
          )}
        </div>

        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
            className={validationErrors.displayName ? 'border-red-500' : ''}
          />
          {validationErrors.displayName && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.displayName}</p>
          )}
        </div>

        {validationErrors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{validationErrors.general}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !username.trim() || !displayName.trim()}
          className="flex-1"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </div>
    </div>
  );
};
