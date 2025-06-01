
import React, { useState, useEffect, useMemo } from 'react';
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

  // Increment render count for diagnostics - but stabilize it
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // Get direct Supabase user for comparison
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: directUser }, error }) => {
      setDirectSupabaseUser(directUser);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Direct Supabase user check:', {
        hasDirectUser: !!directUser,
        directEmail: directUser?.email || null,
        directPhone: directUser?.phone || null,
        directId: directUser?.id || null,
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  // CRITICAL: Log render info but reduce frequency to prevent excessive logs
  if (renderCount % 100 === 1 || renderCount <= 10) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== RENDER START =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Render count:', renderCount);
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Props received:', {
      currentUserProp: !!currentUser,
      currentUserEmail: currentUser?.email || null,
      currentUserPhone: currentUser?.phone || null,
      currentUserId: currentUser?.id || null,
      timestamp: new Date().toISOString()
    });

    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🎯 AUTH CONTEXT FROM useAuth 🎯');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Auth context from useAuth:', {
      hasUser: !!user,
      hasSession: !!session,
      userEmail: user?.email || null,
      userPhone: user?.phone || null,
      userId: user?.id || null,
      sessionUserEmail: session?.user?.email || null,
      sessionUserPhone: session?.user?.phone || null,
      sessionUserId: session?.user?.id || null,
      contextWorking: (!!user || !!session?.user) ? 'YES_CONTEXT_WORKING' : 'NO_CONTEXT_BROKEN',
      timestamp: new Date().toISOString()
    });
  }

  // Use current user from props, context, or direct Supabase check
  const effectiveUser = useMemo(() => {
    return currentUser || user || session?.user || directSupabaseUser;
  }, [currentUser, user, session?.user, directSupabaseUser]);
  
  // Create stable display values using useMemo to prevent re-renders
  const displayValues = useMemo(() => {
    if (!effectiveUser) return null;

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

    return {
      displayName,
      displayIdentifier,
      displayEmail,
      displayPhone,
      displayId,
      avatarUrl: profile?.avatar_url,
      sourceUsed: currentUser ? 'PROP' : user ? 'CONTEXT_USER' : session?.user ? 'CONTEXT_SESSION' : directSupabaseUser ? 'DIRECT_SUPABASE' : 'NONE'
    };
  }, [effectiveUser, profile, currentUser, user, session?.user, directSupabaseUser]);

  if (!effectiveUser || !displayValues) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ❌ NO EFFECTIVE USER - RETURNING NULL ❌');
    return null;
  }

  if (renderCount % 100 === 1 || renderCount <= 10) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🔥 DISPLAY VALUES 🔥');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Display values:', {
      ...displayValues,
      renderCount,
      effectiveUser: !!effectiveUser,
      RENDER_SUCCESS: true,
      timestamp: new Date().toISOString()
    });
  }

  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== MOUNT EFFECT =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Component mounted, render count:', renderCount);
    
    return () => {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== UNMOUNT DETECTED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🚨🚨🚨 AuthenticatedUserDisplay UNMOUNTING 🚨🚨🚨');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Final render count was:', renderCount);
    };
  }, []);

  useEffect(() => {
    if (effectiveUser?.id && effectiveUser?.id.length > 10) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Loading profile for user ID:', effectiveUser.id);
      loadProfile(effectiveUser.id);
    }
  }, [effectiveUser?.id]);

  const loadProfile = async (userId: string) => {
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

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={displayValues.avatarUrl || undefined} alt={displayValues.displayName} />
              <AvatarFallback className="bg-blue-500 text-white">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">
              {displayValues.displayName}
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
