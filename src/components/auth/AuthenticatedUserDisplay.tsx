
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
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
  const [initialized, setInitialized] = useState(false);

  // CRITICAL FIX: Stabilize render counting - only log every 50 renders to reduce spam
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      setRenderCount(1);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== INITIAL RENDER =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Component mounted and initialized');
    } else {
      setRenderCount(prev => {
        const newCount = prev + 1;
        // Only log every 50 renders to reduce console spam
        if (newCount % 50 === 0) {
          console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Render milestone:', newCount);
          console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ⚠️ HIGH RENDER COUNT - investigating cause');
        }
        return newCount;
      });
    }
  });

  // Get direct Supabase user for comparison - STABILIZED with useCallback
  const checkDirectSupabaseUser = useCallback(async () => {
    try {
      const { data: { user: directUser }, error } = await supabase.auth.getUser();
      setDirectSupabaseUser(directUser);
      if (renderCount <= 5) {
        console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Direct Supabase user check:', {
          hasDirectUser: !!directUser,
          directEmail: directUser?.email || null,
          directPhone: directUser?.phone || null,
          directId: directUser?.id || null,
          error: error?.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Error checking direct user:', error);
    }
  }, [renderCount]);

  useEffect(() => {
    if (initialized) {
      checkDirectSupabaseUser();
    }
  }, [initialized, checkDirectSupabaseUser]);

  // CRITICAL: Log comprehensive auth context state but reduce frequency
  useEffect(() => {
    if (renderCount <= 10 || renderCount % 100 === 0) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== CONTEXT STATE CHECK =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Render count:', renderCount);
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Props received:', {
        currentUserProp: !!currentUser,
        currentUserEmail: currentUser?.email || null,
        currentUserPhone: currentUser?.phone || null,
        currentUserId: currentUser?.id || null
      });

      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🎯 AUTH CONTEXT FROM useAuth 🎯');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Auth context state:', {
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
  }, [user, session, currentUser, renderCount]);

  // STABILIZED: Use current user from props, context, or direct Supabase check
  const effectiveUser = useMemo(() => {
    return currentUser || user || session?.user || directSupabaseUser;
  }, [currentUser, user, session?.user, directSupabaseUser]);
  
  // STABILIZED: Create display values using useMemo with stable dependencies
  const displayValues = useMemo(() => {
    if (!effectiveUser) return null;

    const displayEmail = effectiveUser?.email;
    const displayPhone = effectiveUser?.phone;
    const displayId = effectiveUser?.id;
    
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
  }, [effectiveUser, profile?.display_name, profile?.username, profile?.avatar_url, currentUser, user, session?.user, directSupabaseUser]);

  // STABILIZED: Load profile with useCallback to prevent re-renders
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
      if (renderCount <= 5) {
        console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Profile loaded successfully:', profileData);
      }
    } catch (error) {
      console.error('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Error loading profile:', error);
    }
  }, [renderCount]);

  // Load profile when user ID changes
  useEffect(() => {
    if (effectiveUser?.id && effectiveUser?.id.length > 10) {
      loadProfile(effectiveUser.id);
    }
  }, [effectiveUser?.id, loadProfile]);

  // STABILIZED: Sign out handler with useCallback
  const handleSignOut = useCallback(async () => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Signing out...');
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  }, [signOut]);

  // STABILIZED: Profile modal handler with useCallback
  const handleProfileModalClose = useCallback((open: boolean) => {
    setProfileModalOpen(open);
    if (!open && effectiveUser?.id && effectiveUser?.id.length > 10) {
      loadProfile(effectiveUser.id);
    }
  }, [effectiveUser?.id, loadProfile]);

  if (!effectiveUser || !displayValues) {
    if (renderCount <= 5) {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ❌ NO EFFECTIVE USER - RETURNING NULL ❌');
    }
    return null;
  }

  if (renderCount <= 10 || renderCount % 100 === 0) {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🔥 DISPLAY VALUES 🔥');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Display values:', {
      ...displayValues,
      renderCount,
      effectiveUser: !!effectiveUser,
      RENDER_SUCCESS: true,
      timestamp: new Date().toISOString()
    });
  }

  // Mount/unmount tracking
  useEffect(() => {
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== MOUNT EFFECT =====');
    console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Component mounted successfully');
    
    return () => {
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: ===== UNMOUNT DETECTED =====');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: 🚨🚨🚨 AuthenticatedUserDisplay UNMOUNTING 🚨🚨🚨');
      console.log('🌟🌟🌟 AUTHENTICATED_USER_DISPLAY_FIXED: Final render count was:', renderCount);
    };
  }, []);

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
