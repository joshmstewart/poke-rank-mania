
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

// CRITICAL FIX: Add manual localStorage check like TrueSkill store
console.log(`🌥️ [CLOUD_PREFERENCES_FIX] ===== CHECKING LOCALSTORAGE FOR PREFERENCES =====`);
const checkLocalStoragePreferences = () => {
  try {
    const formFilters = localStorage.getItem('pokemon-form-filters');
    const imageMode = localStorage.getItem('pokemon-image-mode');
    const imagePreference = localStorage.getItem('pokemon-image-preference');
    
    console.log(`🌥️ [CLOUD_PREFERENCES_FIX] Local form filters:`, !!formFilters);
    console.log(`🌥️ [CLOUD_PREFERENCES_FIX] Local image mode:`, imageMode);
    console.log(`🌥️ [CLOUD_PREFERENCES_FIX] Local image preference:`, imagePreference);
    
    if (formFilters || imageMode || imagePreference) {
      const parsedFilters = formFilters ? JSON.parse(formFilters) : DEFAULT_FORM_FILTERS;
      const imagePrefs: ImagePreferences = {
        mode: (imageMode as 'pokemon' | 'tcg') || 'pokemon',
        type: (imagePreference as 'official' | 'artwork' | 'sprite') || 'official'
      };
      
      return {
        form_filters: parsedFilters,
        image_preferences: imagePrefs
      };
    }
  } catch (error) {
    console.error(`🌥️ [CLOUD_PREFERENCES_FIX] Failed to parse localStorage:`, error);
  }
  return null;
};

export const useCloudPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences when user changes
  useEffect(() => {
    if (!user?.id) {
      // CRITICAL FIX: Even without user, try to load local preferences
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] No user, checking localStorage fallback');
      const localData = checkLocalStoragePreferences();
      if (localData) {
        console.log('🌥️ [CLOUD_PREFERENCES_FIX] Using localStorage fallback:', localData);
        const fallbackPrefs: UserPreferences = {
          user_id: 'local',
          form_filters: localData.form_filters || DEFAULT_FORM_FILTERS,
          image_preferences: localData.image_preferences || DEFAULT_IMAGE_PREFERENCES,
          other_settings: {}
        };
        setPreferences(fallbackPrefs);
      } else {
        setPreferences(null);
      }
      setIsInitialized(false);
      return;
    }

    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        console.log('🌥️ [CLOUD_PREFERENCES] Loading preferences for user:', user.id);
        
        let userPrefs = await getUserPreferences(user.id);
        
        // CRITICAL FIX: If no cloud preferences exist, check localStorage first
        if (!userPrefs) {
          console.log('🌥️ [CLOUD_PREFERENCES_FIX] No cloud preferences, checking localStorage');
          const localData = checkLocalStoragePreferences();
          
          const prefsToCreate = {
            user_id: user.id,
            form_filters: localData?.form_filters || DEFAULT_FORM_FILTERS,
            image_preferences: localData?.image_preferences || DEFAULT_IMAGE_PREFERENCES,
            other_settings: {}
          };
          
          console.log('🌥️ [CLOUD_PREFERENCES_FIX] Creating preferences with local data:', prefsToCreate);
          userPrefs = await upsertUserPreferences(prefsToCreate);
        }

        setPreferences(userPrefs);
        setIsInitialized(true);
        console.log('🌥️ [CLOUD_PREFERENCES] Preferences loaded:', userPrefs);
      } catch (error) {
        console.error('🌥️ [CLOUD_PREFERENCES] Error loading preferences:', error);
        
        // CRITICAL FIX: On error, try localStorage fallback
        console.log('🌥️ [CLOUD_PREFERENCES_FIX] Error occurred, trying localStorage fallback');
        const localData = checkLocalStoragePreferences();
        
        const defaultPrefs: UserPreferences = {
          user_id: user.id,
          form_filters: localData?.form_filters || DEFAULT_FORM_FILTERS,
          image_preferences: localData?.image_preferences || DEFAULT_IMAGE_PREFERENCES,
          other_settings: {}
        };
        
        console.log('🌥️ [CLOUD_PREFERENCES_FIX] Using fallback preferences:', defaultPrefs);
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
    if (!user?.id) {
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] No user, saving to localStorage only');
      localStorage.setItem('pokemon-form-filters', JSON.stringify(filters));
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, form_filters: filters } : {
        user_id: 'local',
        form_filters: filters,
        image_preferences: DEFAULT_IMAGE_PREFERENCES,
        other_settings: {}
      });
      return;
    }

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
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] Form filters updated and saved locally');
    } catch (error) {
      console.error('🌥️ [CLOUD_PREFERENCES] Error updating form filters:', error);
      // Fallback to localStorage only
      localStorage.setItem('pokemon-form-filters', JSON.stringify(filters));
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] Fallback: saved to localStorage only');
    }
  }, [user?.id, preferences]);

  // Update image preferences
  const updateImagePreferences = useCallback(async (imagePrefs: ImagePreferences) => {
    if (!user?.id) {
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] No user, saving image prefs to localStorage only');
      localStorage.setItem('pokemon-image-mode', imagePrefs.mode);
      localStorage.setItem('pokemon-image-preference', imagePrefs.type);
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, image_preferences: imagePrefs } : {
        user_id: 'local',
        form_filters: DEFAULT_FORM_FILTERS,
        image_preferences: imagePrefs,
        other_settings: {}
      });
      return;
    }

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
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] Image preferences updated and saved locally');
    } catch (error) {
      console.error('🌥️ [CLOUD_PREFERENCES] Error updating image preferences:', error);
      // Fallback to localStorage only
      localStorage.setItem('pokemon-image-mode', imagePrefs.mode);
      localStorage.setItem('pokemon-image-preference', imagePrefs.type);
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] Fallback: saved image prefs to localStorage only');
    }
  }, [user?.id, preferences]);

  // Update other settings
  const updateOtherSettings = useCallback(async (settings: Record<string, any>) => {
    if (!user?.id) {
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] No user, cannot save other settings');
      return;
    }

    console.log('🌥️ [CLOUD_PREFERENCES] Updating other settings:', settings);
    
    try {
      const updatedPrefs = await upsertUserPreferences({
        user_id: user.id,
        form_filters: preferences?.form_filters || DEFAULT_FORM_FILTERS,
        image_preferences: preferences?.image_preferences || DEFAULT_IMAGE_PREFERENCES,
        other_settings: { ...preferences?.other_settings, ...settings }
      });
      
      setPreferences(updatedPrefs);
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] Other settings updated successfully');
    } catch (error) {
      console.error('🌥️ [CLOUD_PREFERENCES] Error updating other settings:', error);
    }
  }, [user?.id, preferences]);

  // CRITICAL FIX: Add manual reload function like TrueSkill store
  const forceReloadPreferences = useCallback(() => {
    console.log('🌥️ [CLOUD_PREFERENCES_FIX] ===== FORCE RELOAD TRIGGERED =====');
    const localData = checkLocalStoragePreferences();
    if (localData) {
      const forcedPrefs: UserPreferences = {
        user_id: user?.id || 'local',
        form_filters: localData.form_filters || DEFAULT_FORM_FILTERS,
        image_preferences: localData.image_preferences || DEFAULT_IMAGE_PREFERENCES,
        other_settings: {}
      };
      console.log('🌥️ [CLOUD_PREFERENCES_FIX] Force reload successful:', forcedPrefs);
      setPreferences(forcedPrefs);
      setIsInitialized(true);
      return forcedPrefs;
    }
    console.log('🌥️ [CLOUD_PREFERENCES_FIX] Force reload found no local data');
    return null;
  }, [user?.id]);

  return {
    preferences,
    isLoading,
    isInitialized,
    formFilters: preferences?.form_filters || DEFAULT_FORM_FILTERS,
    imagePreferences: preferences?.image_preferences || DEFAULT_IMAGE_PREFERENCES,
    otherSettings: preferences?.other_settings || {},
    updateFormFilters,
    updateImagePreferences,
    updateOtherSettings,
    forceReloadPreferences
  };
};
