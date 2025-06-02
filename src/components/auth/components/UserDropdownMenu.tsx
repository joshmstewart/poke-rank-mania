
import React, { useState, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { ProfileModal } from '../ProfileModal';

interface UserDropdownMenuProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      username?: string;
      display_name?: string;
    };
  };
}

export const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({ user }) => {
  const { signOut } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] ===== USER DROPDOWN MENU RENDER =====');
  console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] 🚨🚨🚨 RECEIVED USER PROP ANALYSIS 🚨🚨🚨');
  console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] User prop details:', {
    userId: user?.id?.substring(0, 8),
    userEmail: user?.email,
    hasUserMetadata: !!user?.user_metadata,
    userMetadata: user?.user_metadata,
    userMetadataType: typeof user?.user_metadata,
    userMetadataKeys: user?.user_metadata ? Object.keys(user.user_metadata) : 'NO_METADATA'
  });

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  const handleProfileModalOpen = useCallback(() => {
    setProfileModalOpen(true);
  }, []);

  const handleProfileModalClose = useCallback((open: boolean) => {
    setProfileModalOpen(open);
  }, []);

  const displayName = user.user_metadata?.display_name || user.user_metadata?.username || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;
  const userInitials = displayName.charAt(0).toUpperCase();

  console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] ===== AVATAR URL COMPREHENSIVE ANALYSIS =====');
  console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] 🎯 AVATAR URL EXTRACTION:', {
    rawAvatarUrl: avatarUrl,
    avatarUrlType: typeof avatarUrl,
    avatarUrlLength: avatarUrl?.length || 0,
    avatarUrlIsTruthy: !!avatarUrl,
    avatarUrlIsEmptyString: avatarUrl === '',
    avatarUrlIsNull: avatarUrl === null,
    avatarUrlIsUndefined: avatarUrl === undefined,
    avatarUrlTrimmed: avatarUrl?.trim?.(),
    avatarUrlStartsWith: avatarUrl?.startsWith ? {
      http: avatarUrl.startsWith('http'),
      https: avatarUrl.startsWith('https'),
      data: avatarUrl.startsWith('data:')
    } : 'NO_STARTS_WITH_METHOD'
  });
  
  console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] 🎯 DISPLAY VALUES:', {
    displayName,
    userInitials,
    willRenderAvatarImage: !!avatarUrl && avatarUrl !== '',
    timestamp: new Date().toISOString()
  });

  const shouldRenderAvatarImage = avatarUrl && avatarUrl.trim() !== '';
  console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] 🎯 FINAL RENDER DECISION:', {
    shouldRenderAvatarImage,
    renderingLogic: `avatarUrl=${avatarUrl} && avatarUrl.trim()="${avatarUrl?.trim?.()}" !== ""`
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3">
            <Avatar className="h-12 w-12">
              {shouldRenderAvatarImage && (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={displayName}
                  onLoad={() => {
                    console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] ✅✅✅ AVATAR IMAGE LOADED SUCCESSFULLY ✅✅✅');
                    console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] ✅ Loaded avatar URL:', avatarUrl);
                    console.log('🎭🎭🎭 [USER_DROPDOWN_TRACE] ✅ Image load timestamp:', new Date().toISOString());
                  }}
                  onError={(e) => {
                    console.error('🎭🎭🎭 [USER_DROPDOWN_TRACE] ❌❌❌ AVATAR IMAGE FAILED TO LOAD ❌❌❌');
                    console.error('🎭🎭🎭 [USER_DROPDOWN_TRACE] ❌ Failed avatar URL:', avatarUrl);
                    console.error('🎭🎭🎭 [USER_DROPDOWN_TRACE] ❌ Error event:', e);
                    console.error('🎭🎭🎭 [USER_DROPDOWN_TRACE] ❌ Error timestamp:', new Date().toISOString());
                  }}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium truncate max-w-32">
              {displayName}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleProfileModalOpen}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </>
  );
};
