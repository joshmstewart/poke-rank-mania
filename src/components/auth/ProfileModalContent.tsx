
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
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export const ProfileModalContent: React.FC<ProfileModalContentProps> = ({
  loading,
  selectedAvatar,
  setSelectedAvatar,
  username,
  setUsername,
  displayName,
  setDisplayName,
  saving,
  onCancel,
  onSave
}) => {
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
      />
      <ProfileModalActions
        onCancel={onCancel}
        onSave={onSave}
        saving={saving}
      />
    </div>
  );
};
