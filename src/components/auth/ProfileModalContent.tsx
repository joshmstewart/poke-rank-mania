
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfileAvatarSection } from './components/ProfileAvatarSection';
import { ProfileFormFields } from './components/ProfileFormFields';
import { ProfileActionButtons } from './components/ProfileActionButtons';
import { useProfileValidation } from './hooks/useProfileValidation';
import { useProfileSave } from './hooks/useProfileSave';

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
  const { validationErrors, validateProfile, handleDatabaseError, clearErrors } = useProfileValidation();
  const { isSaving, saveProfile } = useProfileSave();

  // Clear errors when user starts typing
  useEffect(() => {
    if (validationErrors.username || validationErrors.displayName) {
      const timer = setTimeout(clearErrors, 3000);
      return () => clearTimeout(timer);
    }
  }, [username, displayName, validationErrors, clearErrors]);

  const handleSave = async () => {
    await saveProfile(
      selectedAvatar,
      username,
      displayName,
      validateProfile,
      handleDatabaseError,
      clearErrors,
      onSaveSuccess
    );
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
      <ProfileAvatarSection
        selectedAvatar={selectedAvatar}
        displayName={displayName}
        onAvatarClick={onAvatarClick}
      />

      <ProfileFormFields
        username={username}
        setUsername={setUsername}
        displayName={displayName}
        setDisplayName={setDisplayName}
        validationErrors={validationErrors}
      />

      <ProfileActionButtons
        onCancel={onCancel}
        onSave={handleSave}
        isSaving={isSaving}
        username={username}
        displayName={displayName}
      />
    </div>
  );
};
