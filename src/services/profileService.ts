
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

// Predefined trainer avatars organized by generation
export const TRAINER_AVATARS: TrainerAvatar[] = [
  // Generation 1
  { id: 'red', name: 'Red', generation: 1, category: 'Kanto Champions', url: '/trainer-avatars/gen1/red.png' },
  { id: 'blue', name: 'Blue', generation: 1, category: 'Kanto Champions', url: '/trainer-avatars/gen1/blue.png' },
  { id: 'ash-kanto', name: 'Ash (Kanto)', generation: 1, category: 'Protagonists', url: '/trainer-avatars/gen1/ash.png' },
  { id: 'misty', name: 'Misty', generation: 1, category: 'Gym Leaders', url: '/trainer-avatars/gen1/misty.png' },
  { id: 'brock', name: 'Brock', generation: 1, category: 'Gym Leaders', url: '/trainer-avatars/gen1/brock.png' },
  
  // Generation 2
  { id: 'gold', name: 'Gold', generation: 2, category: 'Johto Champions', url: '/trainer-avatars/gen2/gold.png' },
  { id: 'silver', name: 'Silver', generation: 2, category: 'Johto Champions', url: '/trainer-avatars/gen2/silver.png' },
  { id: 'crystal', name: 'Crystal', generation: 2, category: 'Johto Champions', url: '/trainer-avatars/gen2/crystal.png' },
  
  // Generation 3
  { id: 'brendan', name: 'Brendan', generation: 3, category: 'Hoenn Champions', url: '/trainer-avatars/gen3/brendan.png' },
  { id: 'may', name: 'May', generation: 3, category: 'Hoenn Champions', url: '/trainer-avatars/gen3/may.png' },
  { id: 'steven', name: 'Steven', generation: 3, category: 'Champions', url: '/trainer-avatars/gen3/steven.png' },
  
  // Generation 4
  { id: 'lucas', name: 'Lucas', generation: 4, category: 'Sinnoh Champions', url: '/trainer-avatars/gen4/lucas.png' },
  { id: 'dawn', name: 'Dawn', generation: 4, category: 'Sinnoh Champions', url: '/trainer-avatars/gen4/dawn.png' },
  { id: 'cynthia', name: 'Cynthia', generation: 4, category: 'Champions', url: '/trainer-avatars/gen4/cynthia.png' },
  
  // Generation 5
  { id: 'hilbert', name: 'Hilbert', generation: 5, category: 'Unova Champions', url: '/trainer-avatars/gen5/hilbert.png' },
  { id: 'hilda', name: 'Hilda', generation: 5, category: 'Unova Champions', url: '/trainer-avatars/gen5/hilda.png' },
  { id: 'n', name: 'N', generation: 5, category: 'Legends', url: '/trainer-avatars/gen5/n.png' },
];

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
  return TRAINER_AVATARS.reduce((acc, avatar) => {
    if (!acc[avatar.generation]) {
      acc[avatar.generation] = [];
    }
    acc[avatar.generation].push(avatar);
    return acc;
  }, {} as Record<number, TrainerAvatar[]>);
};

export const getTrainerAvatarByUrl = (url: string): TrainerAvatar | undefined => {
  return TRAINER_AVATARS.find(avatar => avatar.url === url);
};
