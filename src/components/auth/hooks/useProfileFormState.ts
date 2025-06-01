
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';

export const useProfileFormState = (open: boolean) => {
  const { user } = useAuth();
  const mountedRef = useRef(true);
  
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarModalOpen, setAvatarModalOpen] = useState<boolean>(false);

  // Store initial values to calculate hasChanges
  const [initialValues, setInitialValues] = useState<{
    avatar: string;
    username: string;
    displayName: string;
  }>({
    avatar: '',
    username: '',
    displayName: ''
  });

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      console.log('🎭 [PROFILE_FORM_STATE] Component unmounting');
      mountedRef.current = false;
    };
  }, []);

  // Initialize form with default values when modal opens
  useEffect(() => {
    if (open && user && mountedRef.current) {
      console.log('🎭 [PROFILE_FORM_STATE] Initializing form for user:', user.id);
      
      // Set defaults based on user info
      let defaultDisplayName = 'New User';
      let defaultUsername = 'new_user';
      
      if (user.phone) {
        const phoneDigits = user.phone.replace(/\D/g, '');
        const lastFour = phoneDigits.slice(-4);
        defaultDisplayName = `User ${lastFour}`;
        defaultUsername = `user_${lastFour}`;
      } else if (user.email) {
        const emailPart = user.email.split('@')[0];
        defaultDisplayName = emailPart;
        defaultUsername = emailPart;
      }
      
      console.log('🎭 [PROFILE_FORM_STATE] Setting defaults:', {
        displayName: defaultDisplayName,
        username: defaultUsername
      });
      
      // Use functional updates to prevent stale state issues
      setSelectedAvatar(() => '');
      setUsername(() => defaultUsername);
      setDisplayName(() => defaultDisplayName);
      
      // Set initial values for hasChanges calculation
      setInitialValues({
        avatar: '',
        username: defaultUsername,
        displayName: defaultDisplayName
      });
    }
    
    if (!open && mountedRef.current) {
      console.log('🎭 [PROFILE_FORM_STATE] Modal closed, resetting form');
      setSelectedAvatar(() => '');
      setUsername(() => '');
      setDisplayName(() => '');
      setInitialValues({
        avatar: '',
        username: '',
        displayName: ''
      });
    }
  }, [open, user?.id, user?.email, user?.phone]);

  return {
    selectedAvatar,
    setSelectedAvatar,
    username,
    setUsername,
    displayName,
    setDisplayName,
    avatarModalOpen,
    setAvatarModalOpen,
    initialValues,
    mountedRef
  };
};
