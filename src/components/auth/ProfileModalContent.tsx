
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
  onAvatarClick: () => void;
  hasChanges?: boolean;
  user?: any;
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
  onSave,
  onAvatarClick,
  hasChanges,
  user
}) => {
  console.log('📝 [PROFILE_CONTENT] ===== RENDER =====');
  console.log('📝 [PROFILE_CONTENT] onSave function received:', {
    onSaveExists: !!onSave,
    onSaveType: typeof onSave,
    saving,
    hasChanges,
    userExists: !!user,
    timestamp: new Date().toISOString()
  });

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
        onSave={onSave}
        saving={saving}
        hasChanges={hasChanges}
        user={user}
      />
    </div>
  );
};
