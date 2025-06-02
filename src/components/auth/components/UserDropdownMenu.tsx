
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
import { User, Settings, LogOut, ChevronDown, Hash, Database } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { supabase } from '@/integrations/supabase/client';
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
  const { sessionId } = useTrueSkillStore();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] ===== USER DROPDOWN MENU RENDER =====');
  console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] User received:', {
    userId: user?.id?.substring(0, 8),
    userEmail: user?.email,
    hasUserMetadata: !!user?.user_metadata,
    avatarUrl: user?.user_metadata?.avatar_url,
    avatarUrlType: typeof user?.user_metadata?.avatar_url,
    avatarUrlLength: user?.user_metadata?.avatar_url?.length || 0
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

  // INVESTIGATION: Check for multiple sessions in database
  const investigateMultipleSessions = useCallback(async () => {
    console.log('🔍🔍🔍 [SESSION_INVESTIGATION] ===== INVESTIGATING MULTIPLE SESSIONS =====');
    console.log('🔍🔍🔍 [SESSION_INVESTIGATION] Current user ID:', user.id);
    console.log('🔍🔍🔍 [SESSION_INVESTIGATION] Current sessionId from store:', sessionId);
    
    try {
      // Check profile for stored sessionId
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('trueskill_session_id')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log('🔍🔍🔍 [SESSION_INVESTIGATION] Profile query result:', { profile, profileError });
      
      // Check ALL trueskill_sessions that might be linked to this user
      const { data: allSessions, error: sessionsError } = await supabase
        .from('trueskill_sessions')
        .select('session_id, created_at, last_updated, ratings_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('🔍🔍🔍 [SESSION_INVESTIGATION] All sessions for user:', allSessions);
      console.log('🔍🔍🔍 [SESSION_INVESTIGATION] Sessions error:', sessionsError);
      
      if (allSessions && allSessions.length > 1) {
        console.log('🔍🔍🔍 [SESSION_INVESTIGATION] ⚠️ MULTIPLE SESSIONS FOUND! ⚠️');
        allSessions.forEach((session, index) => {
          const ratingsCount = Object.keys(session.ratings_data || {}).length;
          console.log(`🔍🔍🔍 [SESSION_INVESTIGATION] Session ${index + 1}:`, {
            sessionId: session.session_id,
            ratingsCount,
            createdAt: session.created_at,
            lastUpdated: session.last_updated,
            isInProfile: session.session_id === profile?.trueskill_session_id,
            isInStore: session.session_id === sessionId
          });
        });
      }
      
      // Also check if there are orphaned sessions (no user_id but might match our sessionIds)
      const { data: orphanedSessions, error: orphanedError } = await supabase
        .from('trueskill_sessions')
        .select('session_id, created_at, last_updated, ratings_data, user_id')
        .in('session_id', [
          'e7f1feda-e5be-4b2d-9633-253f09f8d030', // The good one with 277
          'bcfdb6b1-d390-4ca5-b978-c5de3a9aa4df'  // The bad one with 19
        ]);
        
      console.log('🔍🔍🔍 [SESSION_INVESTIGATION] Specific session check:', orphanedSessions);
      
    } catch (error) {
      console.error('🔍🔍🔍 [SESSION_INVESTIGATION] Error during investigation:', error);
    }
  }, [user.id, sessionId]);

  const displayName = user.user_metadata?.display_name || user.user_metadata?.username || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;
  const userInitials = displayName.charAt(0).toUpperCase();

  console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] ===== FINAL AVATAR RENDERING DECISION =====');
  console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] avatarUrl:', avatarUrl);
  console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] displayName:', displayName);
  console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] userInitials:', userInitials);
  console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] Will render AvatarImage:', !!avatarUrl);

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
                    console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] ✅✅✅ AVATAR IMAGE LOADED SUCCESSFULLY ✅✅✅');
                    console.log('🎭🎭🎭 [USER_DROPDOWN_FIXED] ✅ Loaded avatar URL:', avatarUrl);
                  }}
                  onError={(e) => {
                    console.error('🎭🎭🎭 [USER_DROPDOWN_FIXED] ❌❌❌ AVATAR IMAGE FAILED TO LOAD ❌❌❌');
                    console.error('🎭🎭🎭 [USER_DROPDOWN_FIXED] ❌ Failed avatar URL:', avatarUrl);
                    console.error('🎭🎭🎭 [USER_DROPDOWN_FIXED] ❌ Error event:', e);
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
          
          <DropdownMenuItem onClick={investigateMultipleSessions}>
            <Database className="mr-2 h-4 w-4" />
            Investigate Sessions
          </DropdownMenuItem>
          
          {sessionId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigator.clipboard.writeText(sessionId)}
                className="cursor-pointer"
              >
                <Hash className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Session ID (click to copy)</span>
                  <span className="text-xs font-mono truncate max-w-[180px]" title={sessionId}>
                    {sessionId}
                  </span>
                </div>
              </DropdownMenuItem>
            </>
          )}
          
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
