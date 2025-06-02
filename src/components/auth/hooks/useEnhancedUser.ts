
import { useMemo } from 'react';

export const useEnhancedUser = (effectiveUser: any, currentProfile: any) => {
  return useMemo(() => {
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] ===== ENHANCED USER CREATION START =====');
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Input effectiveUser:', {
      hasUser: !!effectiveUser,
      userId: effectiveUser?.id?.substring(0, 8),
      userEmail: effectiveUser?.email,
      userMetadata: effectiveUser?.user_metadata,
      userMetadataAvatarUrl: effectiveUser?.user_metadata?.avatar_url
    });
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Input currentProfile:', {
      hasProfile: !!currentProfile,
      profileId: currentProfile?.id?.substring(0, 8),
      profileAvatarUrl: currentProfile?.avatar_url,
      profileUsername: currentProfile?.username,
      profileDisplayName: currentProfile?.display_name,
      profileUpdatedAt: currentProfile?.updated_at
    });

    if (!effectiveUser) {
      console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] No effective user - returning null');
      return null;
    }

    // CRITICAL FIX: Profile avatar takes absolute priority
    const profileAvatarUrl = currentProfile?.avatar_url;
    
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Profile avatar URL extracted:', profileAvatarUrl);
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Profile avatar URL type:', typeof profileAvatarUrl);
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Profile avatar URL length:', profileAvatarUrl?.length || 0);
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Profile avatar URL is truthy:', !!profileAvatarUrl);
    
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

    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] ===== ENHANCED USER FINAL RESULT =====');
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Enhanced user created with avatar_url:', enhancedUser.user_metadata.avatar_url);
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Enhanced user display_name:', enhancedUser.user_metadata.display_name);
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Enhanced user username:', enhancedUser.user_metadata.username);
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Enhanced user full metadata:', enhancedUser.user_metadata);
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] Timestamp:', new Date().toISOString());
    console.log('🎭🎭🎭 [ENHANCED_USER_TRACE] ===== ENHANCED USER CREATION END =====');

    return enhancedUser;
  }, [effectiveUser, currentProfile]);
};
