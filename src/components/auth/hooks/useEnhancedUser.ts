
import { useMemo } from 'react';

export const useEnhancedUser = (effectiveUser: any, currentProfile: any) => {
  return useMemo(() => {
    if (!effectiveUser) return null;

    // CRITICAL FIX: Profile avatar takes absolute priority
    const profileAvatarUrl = currentProfile?.avatar_url;
    
    // Create enhanced user with proper avatar priority
    const enhancedUser = {
      ...effectiveUser,
      user_metadata: {
        ...effectiveUser.user_metadata,
        // FIXED: Use profile avatar as primary source, empty string if none
        avatar_url: profileAvatarUrl || '',
        username: currentProfile?.username || effectiveUser.user_metadata?.username || effectiveUser.email?.split('@')[0] || 'User',
        display_name: currentProfile?.display_name || effectiveUser.user_metadata?.display_name || effectiveUser.user_metadata?.username || 'User',
      }
    };

    console.log('🎭 [ENHANCED_USER] ===== ENHANCED USER DEBUG =====');
    console.log('🎭 [ENHANCED_USER] Profile avatar URL from currentProfile:', profileAvatarUrl);
    console.log('🎭 [ENHANCED_USER] Enhanced user avatar_url set to:', enhancedUser.user_metadata.avatar_url);
    console.log('🎭 [ENHANCED_USER] Enhanced user display_name:', enhancedUser.user_metadata.display_name);
    console.log('🎭 [ENHANCED_USER] Enhanced user username:', enhancedUser.user_metadata.username);
    console.log('🎭 [ENHANCED_USER] ===== END ENHANCED USER DEBUG =====');

    return enhancedUser;
  }, [effectiveUser, currentProfile]);
};
