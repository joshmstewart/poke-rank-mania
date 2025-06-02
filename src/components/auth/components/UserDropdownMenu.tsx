
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
import { User, Settings, LogOut, ChevronDown, Hash, Database, Search, CloudUpload } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { supabase } from '@/integrations/supabase/client';
import { ProfileModal } from '../ProfileModal';
import { toast } from '@/hooks/use-toast';

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
  const { sessionId, getAllRatings, syncToCloud } = useTrueSkillStore();
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

  // FORCE SYNC TO CLOUD: Save localStorage ratings to database and link to user
  const forceSyncToCloud = useCallback(async () => {
    console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] ===== FORCING SYNC TO CLOUD =====');
    console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Current user ID:', user.id);
    console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Current sessionId:', sessionId);
    
    try {
      const allRatings = getAllRatings();
      const ratingsCount = Object.keys(allRatings).length;
      
      console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Ratings to sync:', ratingsCount);
      
      if (ratingsCount === 0) {
        toast({
          title: "No Data to Sync",
          description: "No ratings found in localStorage to sync to cloud.",
          variant: "destructive"
        });
        return;
      }

      // Step 1: Force sync the ratings to cloud
      console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Step 1: Syncing ratings to cloud...');
      await syncToCloud();
      
      // Step 2: Link the session to user profile
      console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Step 2: Linking session to user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ trueskill_session_id: sessionId })
        .eq('id', user.id);

      if (profileError) {
        console.error('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Profile update error:', profileError);
        throw profileError;
      }

      // Step 3: Verify the data was synced
      console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Step 3: Verifying sync...');
      const { data: sessionData, error: sessionError } = await supabase
        .from('trueskill_sessions')
        .select('ratings_data, user_id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (sessionError) {
        console.error('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Session verification error:', sessionError);
        throw sessionError;
      }

      if (sessionData) {
        const cloudRatingsCount = Object.keys(sessionData.ratings_data || {}).length;
        console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] ✅ Cloud verification: Found', cloudRatingsCount, 'ratings');
        console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] ✅ Session user_id:', sessionData.user_id);

        // Step 4: Update the session to link to user if not already linked
        if (!sessionData.user_id) {
          console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Step 4: Linking session user_id...');
          const { error: linkError } = await supabase
            .from('trueskill_sessions')
            .update({ user_id: user.id })
            .eq('session_id', sessionId);

          if (linkError) {
            console.error('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] Session linking error:', linkError);
            throw linkError;
          }
        }

        toast({
          title: "✅ Force Sync Successful!",
          description: `Successfully synced ${ratingsCount} ratings to cloud and linked to your account!`,
          duration: 5000
        });

        console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] ✅✅✅ FORCE SYNC COMPLETED SUCCESSFULLY! ✅✅✅');
        console.log('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] ✅ Your progress is now permanently saved to the cloud!');
        
      } else {
        throw new Error('Session data not found after sync');
      }

    } catch (error) {
      console.error('🚨🚨🚨 [FORCE_SYNC_TO_CLOUD] ❌ Force sync failed:', error);
      toast({
        title: "❌ Force Sync Failed",
        description: `Error syncing to cloud: ${error.message}`,
        variant: "destructive",
        duration: 5000
      });
    }
  }, [user.id, sessionId, getAllRatings, syncToCloud]);

  // COMPREHENSIVE SESSION SEARCH: Find where ratings are actually stored
  const findAllSessions = useCallback(async () => {
    console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] ===== SEARCHING ALL SESSIONS =====');
    console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Current user ID:', user.id);
    console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Current sessionId from store:', sessionId);
    
    try {
      // 1. Check ALL trueskill_sessions regardless of user_id
      console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] === STEP 1: ALL SESSIONS ===');
      const { data: allSessions, error: allError } = await supabase
        .from('trueskill_sessions')
        .select('session_id, user_id, created_at, last_updated, ratings_data')
        .order('created_at', { ascending: false });
      
      console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Total sessions in database: ${allSessions?.length || 0}`);
      
      if (allSessions && allSessions.length > 0) {
        allSessions.forEach((session, index) => {
          const ratingsCount = Object.keys(session.ratings_data || {}).length;
          const isCurrentSession = session.session_id === sessionId;
          const isLinkedToUser = session.user_id === user.id;
          
          console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Session ${index + 1}:`, {
            sessionId: session.session_id,
            userId: session.user_id,
            ratingsCount,
            createdAt: session.created_at,
            lastUpdated: session.last_updated,
            isCurrentSession,
            isLinkedToUser,
            hasSignificantRatings: ratingsCount > 50
          });
          
          // Log the good sessions with lots of ratings
          if (ratingsCount > 50) {
            console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🎯 FOUND GOOD SESSION with ${ratingsCount} ratings!`);
            console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🎯 Session ID: ${session.session_id}`);
            console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🎯 User ID: ${session.user_id || 'NULL'}`);
            console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🎯 Created: ${session.created_at}`);
          }
        });
      }
      
      // 2. Check sessions specifically linked to your user
      console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] === STEP 2: USER-LINKED SESSIONS ===');
      const { data: userSessions, error: userError } = await supabase
        .from('trueskill_sessions')
        .select('session_id, created_at, last_updated, ratings_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Sessions linked to your user: ${userSessions?.length || 0}`);
      
      // 3. Check your profile's stored session ID
      console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] === STEP 3: PROFILE SESSION ===');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('trueskill_session_id')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Profile stored sessionId:', profile?.trueskill_session_id || 'NULL');
      
      // 4. Check for orphaned sessions (no user_id but significant ratings)
      console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] === STEP 4: ORPHANED SESSIONS ===');
      const { data: orphanedSessions, error: orphanedError } = await supabase
        .from('trueskill_sessions')
        .select('session_id, created_at, last_updated, ratings_data')
        .is('user_id', null)
        .order('created_at', { ascending: false });
      
      console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Orphaned sessions (no user_id): ${orphanedSessions?.length || 0}`);
      
      if (orphanedSessions && orphanedSessions.length > 0) {
        orphanedSessions.forEach((session, index) => {
          const ratingsCount = Object.keys(session.ratings_data || {}).length;
          if (ratingsCount > 10) {
            console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🚨 ORPHANED SESSION ${index + 1} with ${ratingsCount} ratings!`);
            console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🚨 Session ID: ${session.session_id}`);
            console.log(`🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🚨 Created: ${session.created_at}`);
          }
        });
      }
      
      // 5. Check localStorage for any session information
      console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] === STEP 5: LOCALSTORAGE CHECK ===');
      const trueskillStorage = localStorage.getItem('trueskill-storage');
      if (trueskillStorage) {
        try {
          const parsed = JSON.parse(trueskillStorage);
          const localSessionId = parsed.state?.sessionId;
          const localRatings = parsed.state?.ratings;
          const localRatingsCount = Object.keys(localRatings || {}).length;
          
          console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] LocalStorage sessionId:', localSessionId);
          console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] LocalStorage ratings count:', localRatingsCount);
          
          if (localRatingsCount > 50) {
            console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] 🎯 LocalStorage has significant ratings!');
          }
        } catch (e) {
          console.error('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Error parsing localStorage:', e);
        }
      }
      
      console.log('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] ===== SEARCH COMPLETE =====');
      
    } catch (error) {
      console.error('🔍🔍🔍 [COMPREHENSIVE_SESSION_SEARCH] Error during search:', error);
    }
  }, [user.id, sessionId]);

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
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={forceSyncToCloud} className="text-green-600">
            <CloudUpload className="mr-2 h-4 w-4" />
            Force Sync to Cloud
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={investigateMultipleSessions}>
            <Database className="mr-2 h-4 w-4" />
            Investigate Sessions
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={findAllSessions}>
            <Search className="mr-2 h-4 w-4" />
            Find All Sessions
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
