import { useMemo } from 'react';

export const useEnhancedUser = (effectiveUser: any, currentProfile: any) => {
  return useMemo(() => {
    if (!effectiveUser) return null;

    // CRITICAL FIX: Only use profile avatar if it exists, otherwise let fallback logic work
    const profileAvatarUrl = currentProfile?.avatar_url;
    
    // Create enhanced user with proper avatar priority
    const enhancedUser = {
      ...effectiveUser,
      user_metadata: {
        ...effectiveUser.user_metadata,
        // FIXED: Use profile avatar if it exists, otherwise keep original or undefined
        avatar_url: profileAvatarUrl || effectiveUser.user_metadata?.avatar_url || undefined,
        username: currentProfile?.username || effectiveUser.user_metadata?.username || effectiveUser.email?.split('@')[0] || 'User',
        display_name: currentProfile?.display_name || effectiveUser.user_metadata?.display_name || effectiveUser.user_metadata?.username || 'User',
      }
    };

    console.log('🎭 [ENHANCED_USER] ===== ENHANCED USER DEBUG =====');
    console.log('🎭 [ENHANCED_USER] Profile avatar URL from currentProfile:', profileAvatarUrl);
    console.log('🎭 [ENHANCED_USER] Original user avatar URL:', effectiveUser.user_metadata?.avatar_url);
    console.log('🎭 [ENHANCED_USER] Final enhanced user avatar_url:', enhancedUser.user_metadata.avatar_url);
    console.log('🎭 [ENHANCED_USER] Enhanced user display_name:', enhancedUser.user_metadata.display_name);
    console.log('🎭 [ENHANCED_USER] Enhanced user username:', enhancedUser.user_metadata.username);
    console.log('🎭 [ENHANCED_USER] ===== END ENHANCED USER DEBUG =====');

    return enhancedUser;
  }, [effectiveUser, currentProfile]);
};
