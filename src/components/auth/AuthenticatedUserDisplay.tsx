
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
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // CRITICAL LOGGING - Always fires when component renders
  console.log('🔵🔵🔵 AuthenticatedUserDisplay: COMPONENT IS MOUNTING/RENDERING');
  console.log('🔵🔵🔵 AuthenticatedUserDisplay: Auth state:', {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (user) {
      console.log('🔵🔵🔵 AuthenticatedUserDisplay: Loading profile for user:', user.id);
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    console.log('🔵🔵🔵 AuthenticatedUserDisplay: Fetching profile data...');
    const profileData = await getProfile(user.id);
    console.log('🔵🔵🔵 AuthenticatedUserDisplay: Profile data received:', profileData);
    setProfile(profileData);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleProfileModalClose = (open: boolean) => {
    setProfileModalOpen(open);
    if (!open) {
      // Reload profile data when modal closes to show updates
      loadProfile();
    }
  };

  // NEVER RETURN NULL - ALWAYS SHOW DEBUG INFO
  console.log('🔵🔵🔵 AuthenticatedUserDisplay: About to render - user exists:', !!user);

  const displayName = profile?.display_name || profile?.username || user?.email || 'Trainer';
  const avatarUrl = profile?.avatar_url;

  console.log('🔵🔵🔵 AuthenticatedUserDisplay: RENDERING DROPDOWN COMPONENT NOW');

  return (
    <div className="bg-blue-100 border-2 border-blue-300 p-2">
      {/* Temporary debug styling to make this component visible */}
      <div className="text-xs font-bold text-blue-800 mb-1">🔵 USER DROPDOWN COMPONENT 🔵</div>
      
      {!user ? (
        <div className="bg-red-200 border-2 border-red-500 p-2">
          <div className="text-red-800 font-bold">❌ NO USER IN AUTHENTICATED DISPLAY ❌</div>
          <div className="text-red-600 text-xs">This component shouldn't render without a user</div>
        </div>
      ) : (
        <div className="bg-green-200 border-2 border-green-500 p-2">
          <div className="text-green-800 font-bold">✅ USER EXISTS: {user.email} ✅</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">
                    {displayName}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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

            <ProfileModal 
              open={profileModalOpen} 
              onOpenChange={handleProfileModalClose}
            />
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
