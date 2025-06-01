
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getProfile, type Profile } from '@/services/profileService';
import { ProfileModal } from './ProfileModal';
import { supabase } from '@/integrations/supabase/client';

interface AuthenticatedUserDisplayProps {
  currentUser?: any;
}

export const AuthenticatedUserDisplay: React.FC<AuthenticatedUserDisplayProps> = ({ currentUser }) => {
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [directSupabaseUser, setDirectSupabaseUser] = useState<any>(null);

  // Increment render count for diagnostics
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // Get direct Supabase user for comparison
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: directUser }, error }) => {
      setDirectSupabaseUser(directUser);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Direct Supabase user check:', {
        hasDirectUser: !!directUser,
        directEmail: directUser?.email || 'NO_EMAIL',
        directPhone: directUser?.phone || 'NO_PHONE',
        directId: directUser?.id || 'NO_ID',
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== RENDER START =====');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🔥 FIXED RENDERING MODE 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Render count:', renderCount);
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Props received:', {
    currentUserProp: !!currentUser,
    currentUserEmail: currentUser?.email || 'NO_PROP_EMAIL',
    currentUserPhone: currentUser?.phone || 'NO_PROP_PHONE',
    currentUserId: currentUser?.id || 'NO_PROP_ID',
    timestamp: new Date().toISOString()
  });

  // CRITICAL: Log the auth context state from useAuth
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🎯 AUTH CONTEXT FROM useAuth 🎯');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Auth context from useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'NO_CONTEXT_USER_EMAIL',
    userPhone: user?.phone || 'NO_CONTEXT_USER_PHONE',
    userId: user?.id || 'NO_CONTEXT_USER_ID',
    sessionUserEmail: session?.user?.email || 'NO_CONTEXT_SESSION_EMAIL',
    sessionUserPhone: session?.user?.phone || 'NO_CONTEXT_SESSION_PHONE',
    sessionUserId: session?.user?.id || 'NO_CONTEXT_SESSION_ID',
    contextWorking: (!!user || !!session?.user) ? 'YES_CONTEXT_WORKING' : 'NO_CONTEXT_BROKEN',
    timestamp: new Date().toISOString()
  });

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🎯 DIRECT SUPABASE USER 🎯');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Direct Supabase user:', {
    hasDirectUser: !!directSupabaseUser,
    directUserEmail: directSupabaseUser?.email || 'NO_DIRECT_EMAIL',
    directUserPhone: directSupabaseUser?.phone || 'NO_DIRECT_PHONE',
    directUserId: directSupabaseUser?.id || 'NO_DIRECT_ID',
    timestamp: new Date().toISOString()
  });

  // Use current user from props, context, or direct Supabase check
  const effectiveUser = currentUser || user || session?.user || directSupabaseUser;
  
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🔥 EFFECTIVE USER ANALYSIS 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Effective user analysis:', {
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'PROP' : user ? 'CONTEXT_USER' : session?.user ? 'CONTEXT_SESSION' : directSupabaseUser ? 'DIRECT_SUPABASE' : 'NONE',
    effectiveUserEmail: effectiveUser?.email || 'NO_EFFECTIVE_EMAIL',
    effectiveUserPhone: effectiveUser?.phone || 'NO_EFFECTIVE_PHONE',
    effectiveUserId: effectiveUser?.id || 'NO_EFFECTIVE_ID',
    willRender: !!effectiveUser,
    renderDecision: !!effectiveUser ? 'WILL_RENDER' : 'WILL_NOT_RENDER',
    timestamp: new Date().toISOString()
  });
  
  if (!effectiveUser) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ❌ NO EFFECTIVE USER - RETURNING NULL ❌');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Render decision: NULL (no user found anywhere)');
    return null;
  }
  
  // Handle phone auth vs email auth display
  const displayEmail = effectiveUser?.email;
  const displayPhone = effectiveUser?.phone;
  const displayId = effectiveUser?.id;
  
  // Create display name prioritizing available data
  let displayName = 'User';
  let displayIdentifier = 'unknown';
  
  if (displayEmail) {
    displayName = profile?.display_name || profile?.username || displayEmail.split('@')[0];
    displayIdentifier = displayEmail;
  } else if (displayPhone) {
    displayName = profile?.display_name || profile?.username || 'Phone User';
    displayIdentifier = displayPhone;
  } else if (displayId) {
    displayName = profile?.display_name || profile?.username || 'User';
    displayIdentifier = displayId.substring(0, 8) + '...';
  }

  const avatarUrl = profile?.avatar_url;

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🔥 DISPLAY VALUES 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Display values:', {
    displayName,
    displayEmail: displayEmail || 'NO_EMAIL',
    displayPhone: displayPhone || 'NO_PHONE',
    displayIdentifier,
    displayId: displayId || 'NO_ID',
    avatarUrl: avatarUrl || 'NO_AVATAR',
    profilePresent: !!profile,
    renderCount,
    effectiveUser: !!effectiveUser,
    RENDER_SUCCESS: true,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== MOUNT EFFECT =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Component mounted, render count:', renderCount);
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Mount stack:', new Error().stack);
    
    return () => {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== UNMOUNT DETECTED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🚨🚨🚨 AuthenticatedUserDisplay UNMOUNTING 🚨🚨🚨');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Final render count was:', renderCount);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Unmount stack:', new Error().stack);
    };
  }, []);

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Profile loading effect triggered');
    if (effectiveUser?.id && effectiveUser?.id.length > 10) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Loading profile for user ID:', effectiveUser.id);
      loadProfile(effectiveUser.id);
    } else {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Skipping profile load (no valid ID)');
    }
  }, [currentUser, user, session, directSupabaseUser]);

  const loadProfile = async (userId: string) => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Loading profile for user:', userId);
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Profile loaded successfully:', profileData);
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Signing out...');
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleProfileModalClose = (open: boolean) => {
    setProfileModalOpen(open);
    if (!open && effectiveUser?.id && effectiveUser?.id.length > 10) {
      loadProfile(effectiveUser.id);
    }
  };

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🔥 ABOUT TO RENDER JSX 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: About to render JSX with values:', {
    displayName,
    displayIdentifier,
    hasAvatar: !!avatarUrl,
    renderCount,
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'PROP' : user ? 'CONTEXT_USER' : session?.user ? 'CONTEXT_SESSION' : directSupabaseUser ? 'DIRECT_SUPABASE' : 'NONE',
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-blue-500 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">
              {displayName}
            </span>
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
      </DropdownMenu>

      <ProfileModal 
        open={profileModalOpen} 
        onOpenChange={handleProfileModalClose}
      />
    </div>
  );
};
