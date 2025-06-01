
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
    for (const trainerType of data.results.slice(0, 20)) { // Limit to first 20 for performance
      try {
        const detailResponse = await fetch(trainerType.url);
        const trainerDetail = await detailResponse.json();
        
        // Extract sprite if available
        const sprite = trainerDetail.sprites?.front_default;
        if (sprite) {
          // Determine generation based on trainer type ID (rough approximation)
          let generation = 1;
          if (trainerDetail.id > 50) generation = 2;
          if (trainerDetail.id > 100) generation = 3;
          if (trainerDetail.id > 150) generation = 4;
          if (trainerDetail.id > 200) generation = 5;
          
          trainers.push({
            id: trainerDetail.name,
            name: trainerDetail.name.split('-').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            generation,
            category: 'Trainer',
            url: sprite
          });
        }
      } catch (error) {
        console.warn('📸 Failed to fetch trainer details for:', trainerType.name, error);
      }
    }
    
    console.log('📸 Successfully fetched trainer sprites:', trainers.length);
    return trainers;
    
  } catch (error) {
    console.error('📸 Error fetching trainer types from PokeAPI:', error);
    return getFallbackTrainers();
  }
};

// Fallback trainers if API fails
const getFallbackTrainers = (): TrainerAvatar[] => {
  return [
    { id: 'ace-trainer', name: 'Ace Trainer', generation: 1, category: 'Elite', url: '/trainer-avatars/gen1/red.png' },
    { id: 'youngster', name: 'Youngster', generation: 1, category: 'Basic', url: '/trainer-avatars/gen1/blue.png' },
    { id: 'lass', name: 'Lass', generation: 1, category: 'Basic', url: '/trainer-avatars/gen1/misty.png' },
    { id: 'hiker', name: 'Hiker', generation: 1, category: 'Specialist', url: '/trainer-avatars/gen1/brock.png' },
    { id: 'swimmer', name: 'Swimmer', generation: 2, category: 'Specialist', url: '/trainer-avatars/gen2/gold.png' },
    { id: 'cooltrainer', name: 'Cool Trainer', generation: 2, category: 'Elite', url: '/trainer-avatars/gen2/silver.png' },
    { id: 'pokefan', name: 'Pokéfan', generation: 3, category: 'Basic', url: '/trainer-avatars/gen3/brendan.png' },
    { id: 'breeder', name: 'Breeder', generation: 3, category: 'Specialist', url: '/trainer-avatars/gen3/may.png' },
    { id: 'ninja-boy', name: 'Ninja Boy', generation: 4, category: 'Specialist', url: '/trainer-avatars/gen4/lucas.png' },
    { id: 'battle-girl', name: 'Battle Girl', generation: 4, category: 'Fighter', url: '/trainer-avatars/gen4/dawn.png' },
    { id: 'veteran', name: 'Veteran', generation: 5, category: 'Elite', url: '/trainer-avatars/gen5/hilbert.png' },
    { id: 'psychic', name: 'Psychic', generation: 5, category: 'Specialist', url: '/trainer-avatars/gen5/hilda.png' }
  ];
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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }

  return true;
};

export const getTrainerAvatarsByGeneration = (): Record<number, TrainerAvatar[]> => {
  // This will now be populated by the async function call in the component
  return {};
};

export const getTrainerAvatarByUrl = (url: string): TrainerAvatar | undefined => {
  if (!trainerCache) return undefined;
  return trainerCache.find(avatar => avatar.url === url);
};

// New async function to get trainers by generation
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
