
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
  onAvatarClick
}) => {
  console.log('📝 [PROFILE_CONTENT] ===== RENDER =====');
  console.log('📝 [PROFILE_CONTENT] onSave function received:', {
    onSaveExists: !!onSave,
    onSaveType: typeof onSave,
    saving,
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
      
      {/* DEBUG: Verify onSave is being passed */}
      <div className="bg-blue-100 p-2 border border-blue-300 rounded">
        <p className="text-xs text-blue-700 mb-2">Debug: Content level onSave check</p>
        <p className="text-xs">onSave exists: {String(!!onSave)}</p>
        <p className="text-xs">onSave type: {typeof onSave}</p>
      </div>
      
      <ProfileModalActions
        onCancel={onCancel}
        onSave={onSave}
        saving={saving}
      />
    </div>
  );
};
