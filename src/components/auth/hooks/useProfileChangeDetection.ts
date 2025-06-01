
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
  // Calculate hasChanges
  const hasChanges = 
    selectedAvatar !== initialValues.avatar ||
    username.trim() !== initialValues.username ||
    displayName.trim() !== initialValues.displayName;

  console.log('🎭 [PROFILE_CHANGE_DETECTION] hasChanges calculation:', {
    hasChanges,
    selectedAvatar,
    initialAvatar: initialValues.avatar,
    username: username.trim(),
    initialUsername: initialValues.username,
    displayName: displayName.trim(),
    initialDisplayName: initialValues.displayName
  });

  return { hasChanges };
};
