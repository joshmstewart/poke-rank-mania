
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

  console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] Render with props:', {
    selectedAvatar,
    username,
    displayName,
    hasUser: !!user,
    isSaving
  });

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] Save button clicked!');
    console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] Current state:', {
      isSaving,
      userId: user?.id,
      formData: { selectedAvatar, username, displayName }
    });

    if (!user?.id) {
      console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] No user ID, aborting');
      return;
    }

    if (isSaving) {
      console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] Already saving, aborting');
      return;
    }

    const trimmedUsername = username?.trim() || '';
    const trimmedDisplayName = displayName?.trim() || '';

    console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] About to call directSaveProfile');
    
    const success = await directSaveProfile(user.id, {
      avatar_url: selectedAvatar || '',
      username: trimmedUsername || `user_${user.id.slice(0, 8)}`,
      display_name: trimmedDisplayName || 'New User',
    });

    console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] Save completed, success:', success);

    if (success) {
      console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] Calling onSaveSuccess');
      onSaveSuccess();
    }
  };

  const isButtonDisabled = isSaving || !user;

  console.log('🔘🔘🔘 [NEW_PROFILE_ACTIONS] Button disabled?', isButtonDisabled);

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
