
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
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Direct Supabase user check:', {
        hasDirectUser: !!directUser,
        directEmail: directUser?.email,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: ===== RENDER START =====');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: 🔥 ULTIMATE RENDERING MODE 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Render count:', renderCount);
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Props received:', {
    currentUserProp: !!currentUser,
    currentUserEmail: currentUser?.email || 'no prop email',
    currentUserId: currentUser?.id || 'no prop id',
    propSource: currentUser?.email?.includes('forced-post-login-diagnostic') ? 'FORCED_POST_LOGIN_DIAGNOSTIC' : 'REAL_USER_PROP',
    timestamp: new Date().toISOString()
  });
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Call stack:', new Error().stack);

  // CRITICAL: Log the auth context state from useAuth
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: 🎯 AUTH CONTEXT STATE FROM useAuth 🎯');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Auth context state from useAuth:', {
    hasUser: !!user,
    hasSession: !!session,
    userEmail: user?.email || 'no user email',
    userId: user?.id || 'no user id',
    sessionUserEmail: session?.user?.email || 'no session email',
    sessionUserId: session?.user?.id || 'no session id',
    contextWorking: (!!user || !!session?.user) ? 'YES - CONTEXT WORKING!' : 'NO - CONTEXT BROKEN',
    timestamp: new Date().toISOString()
  });

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: 🎯 DIRECT SUPABASE USER 🎯');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Direct Supabase user:', {
    hasDirectUser: !!directSupabaseUser,
    directUserEmail: directSupabaseUser?.email || 'no direct email',
    directUserId: directSupabaseUser?.id || 'no direct id',
    timestamp: new Date().toISOString()
  });

  // Use current user from props, context, or direct Supabase check
  const effectiveUser = currentUser || user || session?.user || directSupabaseUser;
  
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: 🔥 EFFECTIVE USER ANALYSIS 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Effective user analysis:', {
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'prop' : user ? 'context-user' : session?.user ? 'context-session' : directSupabaseUser ? 'direct-supabase' : 'none',
    effectiveUserEmail: effectiveUser?.email || 'no effective email',
    effectiveUserId: effectiveUser?.id || 'no effective id',
    isForced: currentUser?.email?.includes('forced-post-login-diagnostic'),
    willRender: !!effectiveUser,
    renderDecision: !!effectiveUser ? 'WILL_RENDER' : 'WILL_NOT_RENDER'
  });
  
  if (!effectiveUser) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: ❌ NO EFFECTIVE USER - RETURNING NULL ❌');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Render decision: NULL (no user found anywhere)');
    return null;
  }
  
  const displayEmail = effectiveUser?.email || 'unknown-user@example.com';
  const displayName = profile?.display_name || profile?.username || effectiveUser?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: 🔥 DISPLAY VALUES 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Display values:', {
    displayName,
    displayEmail,
    avatarUrl: avatarUrl || 'no avatar',
    profilePresent: !!profile,
    renderCount,
    effectiveUser: !!effectiveUser,
    RENDER_SUCCESS: true,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: ===== MOUNT EFFECT =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Component mounted, render count:', renderCount);
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Mount stack:', new Error().stack);
    
    return () => {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: ===== UNMOUNT DETECTED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: 🚨🚨🚨 AuthenticatedUserDisplay UNMOUNTING 🚨🚨🚨');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Final render count was:', renderCount);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Unmount stack:', new Error().stack);
    };
  }, []);

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Profile loading effect triggered');
    if (effectiveUser?.id && !effectiveUser?.email?.includes('forced-post-login-diagnostic')) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Loading profile for real user ID:', effectiveUser.id);
      loadProfile(effectiveUser.id);
    } else {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Skipping profile load (diagnostic user or no ID)');
    }
  }, [currentUser, user, session, directSupabaseUser]);

  const loadProfile = async (userId: string) => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Loading profile for user:', userId);
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Profile loaded successfully:', profileData);
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Error loading profile:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: Signing out...');
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const handleProfileModalClose = (open: boolean) => {
    setProfileModalOpen(open);
    if (!open && effectiveUser?.id && !effectiveUser?.email?.includes('forced-post-login-diagnostic')) {
      loadProfile(effectiveUser.id);
    }
  };

  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: 🔥 ABOUT TO RENDER JSX 🔥');
  console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_ULTIMATE: About to render JSX with values:', {
    displayName,
    displayEmail,
    hasAvatar: !!avatarUrl,
    renderCount,
    effectiveUser: !!effectiveUser,
    sourceUsed: currentUser ? 'prop' : user ? 'context-user' : session?.user ? 'context-session' : directSupabaseUser ? 'direct-supabase' : 'none',
    timestamp: new Date().toISOString()
  });

  // Special styling for forced diagnostic mode
  const isForced = currentUser?.email?.includes('forced-post-login-diagnostic');
  const containerStyle = isForced ? {
    border: '3px solid red',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: '5px',
    borderRadius: '5px'
  } : {};

  return (
    <div className="flex items-center gap-2" style={containerStyle}>
      {isForced && (
        <div style={{ fontSize: '10px', color: 'red', fontWeight: 'bold' }}>
          FORCED:
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className={isForced ? "bg-red-500 text-white" : "bg-blue-500 text-white"}>
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
