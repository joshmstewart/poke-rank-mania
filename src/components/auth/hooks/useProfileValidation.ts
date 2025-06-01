
import { useState } from 'react';
import { containsProfanity, getProfanityError } from '@/utils/profanityFilter';

interface ValidationErrors {
  username?: string;
  displayName?: string;
  general?: string;
}

export const useProfileValidation = () => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateUsername = (username: string): string | null => {
    if (!username) {
      return 'Username is required';
    }
    
    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    
    if (username.length > 20) {
      return 'Username must be 20 characters or less';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    return getProfanityError(username);
  };

  const validateDisplayName = (displayName: string): string | null => {
    if (!displayName) {
      return 'Display name is required';
    }
    
    if (displayName.length > 50) {
      return 'Display name must be 50 characters or less';
    }
    
    return getProfanityError(displayName);
  };

  const validateProfile = (username: string, displayName: string): boolean => {
    const errors: ValidationErrors = {};
    
    const usernameError = validateUsername(username);
    if (usernameError) {
      errors.username = usernameError;
    }
    
    const displayNameError = validateDisplayName(displayName);
    if (displayNameError) {
      errors.displayName = displayNameError;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDatabaseError = (error: any): void => {
    const errors: ValidationErrors = {};
    
    if (error.message?.includes('profiles_username_unique')) {
      errors.username = 'This username is already taken. Please choose a different one.';
    } else if (error.message?.includes('profiles_email_unique')) {
      errors.general = 'This email is already associated with another account.';
    } else {
      errors.general = 'An error occurred while saving your profile. Please try again.';
    }
    
    setValidationErrors(errors);
  };

  const clearErrors = () => {
    setValidationErrors({});
  };

  return {
    validationErrors,
    validateProfile,
    handleDatabaseError,
    clearErrors
  };
};
