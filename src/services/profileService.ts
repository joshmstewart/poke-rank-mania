
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  updated_at: string;
  created_at: string;
}

export interface TrainerAvatar {
  id: string;
  name: string;
  generation: number;
  url: string;
  category: string;
}

// Cache for trainer data to avoid repeated API calls
let trainerCache: TrainerAvatar[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch trainer types from PokeAPI
const fetchTrainerTypesFromAPI = async (): Promise<TrainerAvatar[]> => {
  try {
    console.log('📸 Fetching trainer types from PokeAPI...');
    
    // Get list of trainer types
    const response = await fetch('https://pokeapi.co/api/v2/trainer-type?limit=50');
    const data = await response.json();
    
    const trainers: TrainerAvatar[] = [];
    
    // Fetch details for each trainer type
    for (const trainerType of data.results.slice(0, 15)) { // Limit to first 15
      try {
        const detailResponse = await fetch(trainerType.url);
        const trainerDetail = await detailResponse.json();
        
        console.log('📸 Processing trainer:', trainerDetail.name);
        
        // Try different sprite properties
        let sprite = null;
        if (trainerDetail.sprites) {
          sprite = trainerDetail.sprites.front_default || 
                  trainerDetail.sprites.front_male || 
                  trainerDetail.sprites.front_female ||
                  trainerDetail.sprites.back_default;
        }
        
        if (sprite) {
          // Determine generation based on trainer type ID
          let generation = 1;
          if (trainerDetail.id > 20) generation = 2;
          if (trainerDetail.id > 40) generation = 3;
          if (trainerDetail.id > 60) generation = 4;
          if (trainerDetail.id > 80) generation = 5;
          
          // Determine category based on name patterns
          let category = 'Trainer';
          const name = trainerDetail.name.toLowerCase();
          if (name.includes('ace') || name.includes('champion') || name.includes('elite')) {
            category = 'Elite';
          } else if (name.includes('gym') || name.includes('leader')) {
            category = 'Leader';
          } else if (name.includes('youngster') || name.includes('lass') || name.includes('schoolkid')) {
            category = 'Basic';
          } else if (name.includes('hiker') || name.includes('swimmer') || name.includes('sailor')) {
            category = 'Specialist';
          }
          
          trainers.push({
            id: trainerDetail.name,
            name: trainerDetail.name.split('-').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            generation,
            category,
            url: sprite
          });
          
          console.log('📸 Added trainer:', trainerDetail.name, 'with sprite:', sprite);
        } else {
          console.log('📸 No sprite found for trainer:', trainerDetail.name);
        }
      } catch (error) {
        console.warn('📸 Failed to fetch trainer details for:', trainerType.name, error);
      }
    }
    
    console.log('📸 Successfully fetched', trainers.length, 'trainer sprites from PokeAPI');
    return trainers;
    
  } catch (error) {
    console.error('📸 Error fetching trainer types from PokeAPI:', error);
    return [];
  }
};

// Get trainers with caching
const getTrainerAvatars = async (): Promise<TrainerAvatar[]> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (trainerCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return trainerCache;
  }
  
  // Fetch new data
  const trainers = await fetchTrainerTypesFromAPI();
  
  // Update cache
  trainerCache = trainers;
  cacheTimestamp = now;
  
  return trainers;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log('🎯 [PROFILE_SERVICE] Fetching profile for user ID:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('🎯 [PROFILE_SERVICE] Error fetching profile:', error);
      return null;
    }

    console.log('🎯 [PROFILE_SERVICE] Profile fetch result:', data);
    return data;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE] Exception fetching profile:', error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  try {
    console.log('🎯 [PROFILE_SERVICE] Updating profile for user ID:', userId, 'with:', updates);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('🎯 [PROFILE_SERVICE] Error updating profile:', error);
      return false;
    }

    console.log('🎯 [PROFILE_SERVICE] Profile updated successfully');
    return true;
  } catch (error) {
    console.error('🎯 [PROFILE_SERVICE] Exception updating profile:', error);
    return false;
  }
};

export const getTrainerAvatarByUrl = (url: string): TrainerAvatar | undefined => {
  if (!trainerCache) return undefined;
  return trainerCache.find(avatar => avatar.url === url);
};

// Get trainers grouped by generation
export const getTrainerAvatarsByGenerationAsync = async (): Promise<Record<number, TrainerAvatar[]>> => {
  const trainers = await getTrainerAvatars();
  
  return trainers.reduce((acc, avatar) => {
    if (!acc[avatar.generation]) {
      acc[avatar.generation] = [];
    }
    acc[avatar.generation].push(avatar);
    return acc;
  }, {} as Record<number, TrainerAvatar[]>);
};
