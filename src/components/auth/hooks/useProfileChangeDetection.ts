
export const useProfileChangeDetection = (
  selectedAvatar: string,
  username: string,
  displayName: string,
  initialValues: {
    avatar: string;
    username: string;
    displayName: string;
  }
) => {
  // More permissive change detection - any change to avatar, username, or display name counts
  const hasChanges = 
    selectedAvatar !== initialValues.avatar ||
    (username?.trim() || '') !== (initialValues.username || '') ||
    (displayName?.trim() || '') !== (initialValues.displayName || '');

  console.log('🎭 [PROFILE_CHANGE_DETECTION] hasChanges calculation:', {
    hasChanges,
    selectedAvatar,
    initialAvatar: initialValues.avatar,
    username: username?.trim() || '',
    initialUsername: initialValues.username || '',
    displayName: displayName?.trim() || '',
    initialDisplayName: initialValues.displayName || '',
    avatarChanged: selectedAvatar !== initialValues.avatar,
    usernameChanged: (username?.trim() || '') !== (initialValues.username || ''),
    displayNameChanged: (displayName?.trim() || '') !== (initialValues.displayName || '')
  });

  return { hasChanges };
};
