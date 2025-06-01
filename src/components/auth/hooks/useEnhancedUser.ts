
import { useMemo } from 'react';

export const useEnhancedUser = (effectiveUser: any, currentProfile: any) => {
  return useMemo(() => {
    if (!effectiveUser) return null;

    // FIXED: Create enhanced user with proper avatar priority - Profile avatar takes absolute priority
    const enhancedUser = {
      ...effectiveUser,
      user_metadata: {
        ...effectiveUser.user_metadata,
        // CRITICAL FIX: Use the profile avatar directly, not fallback to user metadata
        avatar_url: currentProfile?.avatar_url || '',
        username: currentProfile?.username || effectiveUser.user_metadata?.username || effectiveUser.email?.split('@')[0] || 'User',
        display_name: currentProfile?.display_name || effectiveUser.user_metadata?.display_name || effectiveUser.user_metadata?.username || 'User',
      }
    };

    console.log('🎭 [ENHANCED_USER] ===== ENHANCED USER DEBUG =====');
    console.log('🎭 [ENHANCED_USER] Enhanced user for dropdown:', {
      avatarUrl: enhancedUser.user_metadata.avatar_url,
      displayName: enhancedUser.user_metadata.display_name,
      username: enhancedUser.user_metadata.username,
      hasProfileAvatar: !!currentProfile?.avatar_url,
      profileAvatarUrl: currentProfile?.avatar_url
    });
    console.log('🎭 [ENHANCED_USER] Full enhanced user metadata:', JSON.stringify(enhancedUser.user_metadata, null, 2));
    console.log('🎭 [ENHANCED_USER] ===== END ENHANCED USER DEBUG =====');

    return enhancedUser;
  }, [effectiveUser, currentProfile]);
};
