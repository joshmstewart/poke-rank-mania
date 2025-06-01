
import React from 'react';
import { ProfileModalLoading } from './ProfileModalLoading';
import { ProfileModalForm } from './ProfileModalForm';
import { ProfileModalActions } from './ProfileModalActions';

interface ProfileModalContentProps {
  loading: boolean;
  selectedAvatar: string;
  setSelectedAvatar: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
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
  console.log('📝📝📝 [NEW_PROFILE_CONTENT] Render with simplified props');

  if (loading) {
    return <ProfileModalLoading />;
  }

  return (
    <div className="space-y-6">
      <ProfileModalForm
        selectedAvatar={selectedAvatar}
        setSelectedAvatar={setSelectedAvatar}
        username={username}
        setUsername={setUsername}
        displayName={displayName}
        setDisplayName={setDisplayName}
        onAvatarClick={onAvatarClick}
      />
      
      <ProfileModalActions
        onCancel={onCancel}
        selectedAvatar={selectedAvatar}
        username={username}
        displayName={displayName}
        onSaveSuccess={onSaveSuccess}
      />
    </div>
  );
};
