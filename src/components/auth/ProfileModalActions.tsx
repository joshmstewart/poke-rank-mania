
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useDirectProfileSave } from './hooks/useDirectProfileSave';

interface ProfileModalActionsProps {
  onCancel: () => void;
  selectedAvatar: string;
  username: string;
  displayName: string;
  onSaveSuccess: () => void;
}

export const ProfileModalActions: React.FC<ProfileModalActionsProps> = ({
  onCancel,
  selectedAvatar,
  username,
  displayName,
  onSaveSuccess
}) => {
  const { user } = useAuth();
  const { isSaving, directSaveProfile } = useDirectProfileSave();

  // Remove excessive logging - only log on important actions, not every render
  
  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘 [PROFILE_ACTIONS] Save button clicked!');
    
    if (!user?.id) {
      console.error('🔘 [PROFILE_ACTIONS] No user ID available');
      return;
    }

    if (isSaving) {
      console.log('🔘 [PROFILE_ACTIONS] Already saving, ignoring click');
      return;
    }

    const trimmedUsername = username?.trim() || '';
    const trimmedDisplayName = displayName?.trim() || '';
    
    console.log('🔘 [PROFILE_ACTIONS] About to call directSaveProfile with:', {
      userId: user.id,
      avatar_url: selectedAvatar || '',
      username: trimmedUsername || `user_${user.id.slice(0, 8)}`,
      display_name: trimmedDisplayName || 'New User',
    });

    try {
      const success = await directSaveProfile(user.id, {
        avatar_url: selectedAvatar || '',
        username: trimmedUsername || `user_${user.id.slice(0, 8)}`,
        display_name: trimmedDisplayName || 'New User',
      });

      console.log('🔘 [PROFILE_ACTIONS] Save operation completed with result:', success);

      if (success) {
        console.log('🔘 [PROFILE_ACTIONS] Save successful, calling onSaveSuccess');
        onSaveSuccess();
      } else {
        console.log('🔘 [PROFILE_ACTIONS] Save failed');
      }
    } catch (error) {
      console.error('🔘 [PROFILE_ACTIONS] Error in handleSaveClick:', error);
    }
  };

  const isButtonDisabled = isSaving || !user;

  return (
    <div className="flex flex-col gap-2 pt-4">
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          type="button"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSaveClick}
          disabled={isButtonDisabled}
          type="button"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
