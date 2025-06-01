
import React, { useState, useRef, useCallback } from 'react';
import { updateProfile } from '@/services/profile/updateProfile';
import { toast } from '@/hooks/use-toast';

export const useSimpleProfileSave = () => {
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);
  const savingRef = useRef(false);

  console.log('🔥 [SIMPLE_SAVE_HOOK] ===== HOOK INITIALIZATION =====');
  console.log('🔥 [SIMPLE_SAVE_HOOK] Initial saving state:', saving);
  console.log('🔥 [SIMPLE_SAVE_HOOK] Initial savingRef:', savingRef.current);

  // Manual reset function for debugging
  const resetSavingState = useCallback(() => {
    console.log('🔥 [SIMPLE_SAVE_HOOK] ===== MANUAL RESET TRIGGERED =====');
    console.log('🔥 [SIMPLE_SAVE_HOOK] Before reset - saving:', saving, 'savingRef:', savingRef.current);
    
    savingRef.current = false;
    setSaving(false);
    
    console.log('🔥 [SIMPLE_SAVE_HOOK] After reset - saving should be false');
  }, [saving]);

  // Add to window for debugging
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetProfileSaving = resetSavingState;
      console.log('🔥 [SIMPLE_SAVE_HOOK] Added resetProfileSaving to window for debugging');
    }
  }, [resetSavingState]);

  const saveProfile = useCallback(async (userId: string, profileData: {
    avatar_url: string;
    username: string;
    display_name: string;
  }) => {
    console.log('🔥 [SIMPLE_SAVE] ===== STARTING SAVE OPERATION =====');
    console.log('🔥 [SIMPLE_SAVE] User ID:', userId);
    console.log('🔥 [SIMPLE_SAVE] Profile data:', profileData);
    console.log('🔥 [SIMPLE_SAVE] Current saving state:', saving);
    console.log('🔥 [SIMPLE_SAVE] Current savingRef state:', savingRef.current);
    console.log('🔥 [SIMPLE_SAVE] Component mounted:', mountedRef.current);
    
    if (savingRef.current) {
      console.log('🔥 [SIMPLE_SAVE] ❌ Already saving, skipping');
      return false;
    }

    if (!mountedRef.current) {
      console.log('🔥 [SIMPLE_SAVE] ❌ Component unmounted, skipping');
      return false;
    }

    try {
      console.log('🔥 [SIMPLE_SAVE] ✅ Setting saving to true...');
      savingRef.current = true;
      setSaving(true);
      
      // Add a shorter timeout as safety net
      const timeoutId = setTimeout(() => {
        console.log('🔥 [SIMPLE_SAVE] ⚠️ TIMEOUT: Force resetting saving state after 10 seconds');
        if (mountedRef.current) {
          savingRef.current = false;
          setSaving(false);
          toast({
            title: 'Save Timeout',
            description: 'The save operation took too long and was cancelled. Please try again.',
            variant: 'destructive',
          });
        }
      }, 10000); // 10 second timeout instead of 30
      
      console.log('🔥 [SIMPLE_SAVE] About to call updateProfile...');
      const startTime = Date.now();
      
      const success = await updateProfile(userId, profileData);
      
      const endTime = Date.now();
      console.log('🔥 [SIMPLE_SAVE] updateProfile completed in', (endTime - startTime), 'ms with result:', success);
      
      // Clear timeout since we completed
      clearTimeout(timeoutId);
      
      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        console.log('🔥 [SIMPLE_SAVE] Component unmounted during save, not updating state');
        return success;
      }
      
      if (success) {
        console.log('🔥 [SIMPLE_SAVE] ✅ Save successful, showing success toast');
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        console.log('🔥 [SIMPLE_SAVE] ❌ Save failed, showing error toast');
        toast({
          title: 'Update Failed',
          description: 'Failed to update your profile. Please try again.',
          variant: 'destructive',
        });
      }
      
      console.log('🔥 [SIMPLE_SAVE] About to set saving to false...');
      savingRef.current = false;
      setSaving(false);
      console.log('🔥 [SIMPLE_SAVE] ✅ setSaving(false) completed - saving should now be false');
      
      return success;
    } catch (error) {
      console.error('🔥 [SIMPLE_SAVE] ❌ Exception caught during save:', error);
      console.error('🔥 [SIMPLE_SAVE] Error name:', error?.name);
      console.error('🔥 [SIMPLE_SAVE] Error message:', error?.message);
      console.error('🔥 [SIMPLE_SAVE] Error stack:', error?.stack);
      
      if (mountedRef.current) {
        console.log('🔥 [SIMPLE_SAVE] Setting saving to false after error');
        savingRef.current = false;
        setSaving(false);
        toast({
          title: 'Save Error',
          description: `An error occurred: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      console.log('🔥 [SIMPLE_SAVE] ===== SAVE OPERATION COMPLETED =====');
      console.log('🔥 [SIMPLE_SAVE] Final saving ref state:', savingRef.current);
      console.log('🔥 [SIMPLE_SAVE] Final component mounted state:', mountedRef.current);
    }
  }, []); // Remove saving from dependencies to avoid stale closure

  // Effect to cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log('🔥 [SIMPLE_SAVE] Hook unmounting, setting mountedRef to false');
      mountedRef.current = false;
    };
  }, []);

  // Debug effect to track saving state changes
  React.useEffect(() => {
    console.log('🔥 [SIMPLE_SAVE] ===== SAVING STATE CHANGED =====');
    console.log('🔥 [SIMPLE_SAVE] New saving state:', saving);
    console.log('🔥 [SIMPLE_SAVE] SavingRef current value:', savingRef.current);
    console.log('🔥 [SIMPLE_SAVE] Timestamp:', new Date().toISOString());
  }, [saving]);

  return { saving, saveProfile, resetSavingState };
};
