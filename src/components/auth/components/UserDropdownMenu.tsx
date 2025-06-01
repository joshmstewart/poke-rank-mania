
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

  // CRITICAL DEBUG LOGGING
  console.log('🎭 [USER_DROPDOWN] ===== CRITICAL DEBUG =====');
  console.log('🎭 [USER_DROPDOWN] Full user object:', JSON.stringify(user, null, 2));
  console.log('🎭 [USER_DROPDOWN] Avatar URL from user_metadata:', avatarUrl);
  console.log('🎭 [USER_DROPDOWN] Display name:', displayName);
  console.log('🎭 [USER_DROPDOWN] User initials:', userInitials);
  console.log('🎭 [USER_DROPDOWN] Has avatar URL?', !!avatarUrl);
  console.log('🎭 [USER_DROPDOWN] Avatar URL length:', avatarUrl?.length || 0);
  console.log('🎭 [USER_DROPDOWN] ===== END DEBUG =====');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3">
            <Avatar className="h-12 w-12">
              {avatarUrl && (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={displayName}
                  onLoad={() => {
                    console.log('🎭 [USER_DROPDOWN] ✅ Avatar image LOADED successfully');
                    console.log('🎭 [USER_DROPDOWN] ✅ Loaded avatar URL:', avatarUrl);
                  }}
                  onError={(e) => {
                    console.error('🎭 [USER_DROPDOWN] ❌ Avatar image FAILED to load');
                    console.error('🎭 [USER_DROPDOWN] ❌ Failed avatar URL:', avatarUrl);
                    console.error('🎭 [USER_DROPDOWN] ❌ Error event:', e);
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
