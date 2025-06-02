
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/useAuth';
import { getUserPreferences, upsertUserPreferences, UserPreferences } from '@/services/userPreferences';
import { FormFilters } from '@/hooks/form-filters/types';
import { ImagePreferences } from '@/services/userPreferences';

const DEFAULT_FORM_FILTERS: FormFilters = {
  normal: true,
  megaGmax: false,
  regional: true,
  gender: true,
  forms: true,
  originPrimal: false,
  costumes: false,
  colorsFlavors: false,
  blocked: false
};

const DEFAULT_IMAGE_PREFERENCES: ImagePreferences = {
  mode: 'pokemon',
  type: 'official'
};

export const useCloudPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences when user changes
  useEffect(() => {
    if (!user?.id) {
      setPreferences(null);
      setIsInitialized(false);
      return;
    }

    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        console.log('🌥️ [CLOUD_PREFERENCES] Loading preferences for user:', user.id);
        
        let userPrefs = await getUserPreferences(user.id);
        
        // If no preferences exist, create default ones
        if (!userPrefs) {
          console.log('🌥️ [CLOUD_PREFERENCES] No preferences found, creating defaults');
          userPrefs = await upsertUserPreferences({
            user_id: user.id,
            form_filters: DEFAULT_FORM_FILTERS,
            image_preferences: DEFAULT_IMAGE_PREFERENCES,
            other_settings: {}
          });
        }

        setPreferences(userPrefs);
        setIsInitialized(true);
        console.log('🌥️ [CLOUD_PREFERENCES] Preferences loaded:', userPrefs);
      } catch (error) {
        console.error('🌥️ [CLOUD_PREFERENCES] Error loading preferences:', error);
        // Set defaults on error
        const defaultPrefs: UserPreferences = {
          user_id: user.id,
          form_filters: DEFAULT_FORM_FILTERS,
          image_preferences: DEFAULT_IMAGE_PREFERENCES,
          other_settings: {}
        };
        setPreferences(defaultPrefs);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id]);

  // Update form filters
  const updateFormFilters = useCallback(async (filters: FormFilters) => {
    if (!user?.id) return;

    console.log('🌥️ [CLOUD_PREFERENCES] Updating form filters:', filters);
    
    try {
      const updatedPrefs = await upsertUserPreferences({
        user_id: user.id,
        form_filters: filters,
        image_preferences: preferences?.image_preferences || DEFAULT_IMAGE_PREFERENCES,
        other_settings: preferences?.other_settings || {}
      });
      
      setPreferences(updatedPrefs);
      
      // Also save to localStorage for offline access
      localStorage.setItem('pokemon-form-filters', JSON.stringify(filters));
    } catch (error) {
      console.error('🌥️ [CLOUD_PREFERENCES] Error updating form filters:', error);
      // Fallback to localStorage only
      localStorage.setItem('pokemon-form-filters', JSON.stringify(filters));
    }
  }, [user?.id, preferences]);

  // Update image preferences
  const updateImagePreferences = useCallback(async (imagePrefs: ImagePreferences) => {
    if (!user?.id) return;

    console.log('🌥️ [CLOUD_PREFERENCES] Updating image preferences:', imagePrefs);
    
    try {
      const updatedPrefs = await upsertUserPreferences({
        user_id: user.id,
        form_filters: preferences?.form_filters || DEFAULT_FORM_FILTERS,
        image_preferences: imagePrefs,
        other_settings: preferences?.other_settings || {}
      });
      
      setPreferences(updatedPrefs);
      
      // Also save to localStorage for offline access
      localStorage.setItem('pokemon-image-mode', imagePrefs.mode);
      localStorage.setItem('pokemon-image-preference', imagePrefs.type);
    } catch (error) {
      console.error('🌥️ [CLOUD_PREFERENCES] Error updating image preferences:', error);
      // Fallback to localStorage only
      localStorage.setItem('pokemon-image-mode', imagePrefs.mode);
      localStorage.setItem('pokemon-image-preference', imagePrefs.type);
    }
  }, [user?.id, preferences]);

  // Update other settings
  const updateOtherSettings = useCallback(async (settings: Record<string, any>) => {
    if (!user?.id) return;

    console.log('🌥️ [CLOUD_PREFERENCES] Updating other settings:', settings);
    
    try {
      const updatedPrefs = await upsertUserPreferences({
        user_id: user.id,
        form_filters: preferences?.form_filters || DEFAULT_FORM_FILTERS,
        image_preferences: preferences?.image_preferences || DEFAULT_IMAGE_PREFERENCES,
        other_settings: { ...preferences?.other_settings, ...settings }
      });
      
      setPreferences(updatedPrefs);
    } catch (error) {
      console.error('🌥️ [CLOUD_PREFERENCES] Error updating other settings:', error);
    }
  }, [user?.id, preferences]);

  return {
    preferences,
    isLoading,
    isInitialized,
    formFilters: preferences?.form_filters || DEFAULT_FORM_FILTERS,
    imagePreferences: preferences?.image_preferences || DEFAULT_IMAGE_PREFERENCES,
    otherSettings: preferences?.other_settings || {},
    updateFormFilters,
    updateImagePreferences,
    updateOtherSettings
  };
};
