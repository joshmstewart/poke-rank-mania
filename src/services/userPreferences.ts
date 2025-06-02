
import { supabase } from '@/integrations/supabase/client';
import { FormFilters } from '@/hooks/form-filters/types';

export interface ImagePreferences {
  mode: 'pokemon' | 'tcg';
  type: 'official' | 'artwork' | 'sprite';
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  form_filters: FormFilters;
  image_preferences: ImagePreferences;
  other_settings: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  console.log('🌥️ [USER_PREFERENCES] Fetching preferences for user:', userId);
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('🌥️ [USER_PREFERENCES] Error fetching preferences:', error);
    throw error;
  }

  if (!data) {
    console.log('🌥️ [USER_PREFERENCES] No preferences found for user');
    return null;
  }

  console.log('🌥️ [USER_PREFERENCES] Preferences fetched:', data);
  return {
    ...data,
    form_filters: data.form_filters as FormFilters,
    image_preferences: data.image_preferences as ImagePreferences,
    other_settings: data.other_settings as Record<string, any>
  } as UserPreferences;
};

export const createUserPreferences = async (preferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreferences> => {
  console.log('🌥️ [USER_PREFERENCES] Creating preferences for user:', preferences.user_id);
  
  const { data, error } = await supabase
    .from('user_preferences')
    .insert({
      user_id: preferences.user_id,
      form_filters: preferences.form_filters as any,
      image_preferences: preferences.image_preferences as any,
      other_settings: preferences.other_settings as any
    })
    .select()
    .single();

  if (error) {
    console.error('🌥️ [USER_PREFERENCES] Error creating preferences:', error);
    throw error;
  }

  console.log('🌥️ [USER_PREFERENCES] Preferences created:', data);
  return {
    ...data,
    form_filters: data.form_filters as FormFilters,
    image_preferences: data.image_preferences as ImagePreferences,
    other_settings: data.other_settings as Record<string, any>
  } as UserPreferences;
};

export const updateUserPreferences = async (
  userId: string, 
  updates: Partial<Pick<UserPreferences, 'form_filters' | 'image_preferences' | 'other_settings'>>
): Promise<UserPreferences> => {
  console.log('🌥️ [USER_PREFERENCES] Updating preferences for user:', userId, updates);
  
  const updateData: any = {};
  if (updates.form_filters) updateData.form_filters = updates.form_filters;
  if (updates.image_preferences) updateData.image_preferences = updates.image_preferences;
  if (updates.other_settings) updateData.other_settings = updates.other_settings;
  
  const { data, error } = await supabase
    .from('user_preferences')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('🌥️ [USER_PREFERENCES] Error updating preferences:', error);
    throw error;
  }

  console.log('🌥️ [USER_PREFERENCES] Preferences updated:', data);
  return {
    ...data,
    form_filters: data.form_filters as FormFilters,
    image_preferences: data.image_preferences as ImagePreferences,
    other_settings: data.other_settings as Record<string, any>
  } as UserPreferences;
};

export const upsertUserPreferences = async (preferences: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreferences> => {
  console.log('🌥️ [USER_PREFERENCES] Upserting preferences for user:', preferences.user_id);
  
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: preferences.user_id,
      form_filters: preferences.form_filters as any,
      image_preferences: preferences.image_preferences as any,
      other_settings: preferences.other_settings as any
    }, { 
      onConflict: 'user_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('🌥️ [USER_PREFERENCES] Error upserting preferences:', error);
    throw error;
  }

  console.log('🌥️ [USER_PREFERENCES] Preferences upserted:', data);
  return {
    ...data,
    form_filters: data.form_filters as FormFilters,
    image_preferences: data.image_preferences as ImagePreferences,
    other_settings: data.other_settings as Record<string, any>
  } as UserPreferences;
};
