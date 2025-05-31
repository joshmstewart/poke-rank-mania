
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getProfile, type Profile } from '@/services/profileService';
import { ProfileModal } from './ProfileModal';

export const AuthenticatedUserDisplay: React.FC = () => {
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  console.log('🔵 AuthenticatedUserDisplay: Rendering with auth state:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email,
    userId: user?.id,
    sessionUserEmail: session?.user?.email,
    sessionUserId: session?.user?.id,
    timestamp: new Date().toISOString()
  });

  // Get the current user from either user or session
  const currentUser = user || session?.user;
  
  // Set display values with proper fallbacks
  const displayEmail = currentUser?.email || 'Unknown User';
  const displayName = profile?.display_name || profile?.username || currentUser?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  console.log('🔵 AuthenticatedUserDisplay: Final display values:', {
    currentUser: !!currentUser,
    displayName,
    displayEmail,
    avatarUrl,
    userFromAuth: user?.email,
    userFromSession: session?.user?.email
  });

  useEffect(() => {
    // Load profile if we have either user or session
    if (currentUser?.id) {
      loadProfile(currentUser.id);
    }
  }, [user, session]);

  const loadProfile = async (userId: string) => {
    console.log('🔵 AuthenticatedUserDisplay: Loading profile for user:', userId);
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      console.log('🔵 AuthenticatedUserDisplay: Profile loaded:', profileData);
    } catch (error) {
      console.error('🔵 AuthenticatedUserDisplay: Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🔵 AuthenticatedUserDisplay: Signing out...');
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleProfileModalClose = (open: boolean) => {
    setProfileModalOpen(open);
    if (!open && currentUser?.id) {
      loadProfile(currentUser.id);
    }
  };

  console.log('🔵 AuthenticatedUserDisplay: Rendering dropdown with user:', displayName);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-blue-500 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {displayName}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border z-50">
          <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            My Profile
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
