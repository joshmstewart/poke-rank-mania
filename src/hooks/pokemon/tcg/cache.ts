
import { TCGCard, CachedTCGCard } from './types';
import { supabase } from '@/integrations/supabase/client';

// Cache configuration
const CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours

// Database cache using Supabase
export const getCachedCard = async (pokemonName: string): Promise<TCGCard | null> => {
  try {
    const { data, error } = await supabase
      .from('tcg_cards_cache')
      .select('card_data, second_card_data, created_at')
      .eq('pokemon_name', pokemonName.toLowerCase())
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected for cache misses
        console.log(`🃏 [TCG_CACHE] No cached card found for ${pokemonName}`);
        return null;
      }
      console.error(`🃏 [TCG_CACHE] Error reading cache for ${pokemonName}:`, error);
      return null;
    }
    
    if (!data) return null;
    
    // Check if cache is expired
    const now = Date.now();
    const cacheTime = new Date(data.created_at).getTime();
    const expiryTime = cacheTime + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (now > expiryTime) {
      // Cache expired, remove it
      console.log(`🃏 [TCG_CACHE] Cache expired for ${pokemonName}, removing...`);
      await supabase
        .from('tcg_cards_cache')
        .delete()
        .eq('pokemon_name', pokemonName.toLowerCase());
      return null;
    }
    
    console.log(`🃏 [TCG_CACHE] Found valid cached card for ${pokemonName}:`, data.card_data);
    return data.card_data as unknown as TCGCard;
  } catch (error) {
    console.error(`🃏 [TCG_CACHE] Error reading cache for ${pokemonName}:`, error);
    return null;
  }
};

export const setCachedCard = async (pokemonName: string, firstCard: TCGCard | null, secondCard?: TCGCard | null): Promise<void> => {
  try {
    if (!firstCard) {
      // If no card found, we can still cache this negative result to avoid repeated API calls
      console.log(`🃏 [TCG_CACHE] Caching negative result for ${pokemonName}`);
      return;
    }

    const { error } = await supabase
      .from('tcg_cards_cache')
      .upsert([
        {
          pokemon_name: pokemonName.toLowerCase(),
          card_data: firstCard as any,
          second_card_data: secondCard || null,
          updated_at: new Date().toISOString()
        }
      ], {
        onConflict: 'pokemon_name'
      });

    if (error) {
      console.error(`🃏 [TCG_CACHE] Error saving cache for ${pokemonName}:`, error);
      return;
    }

    console.log(`🃏 [TCG_CACHE] Successfully cached card for ${pokemonName}`);
  } catch (error) {
    console.error(`🃏 [TCG_CACHE] Error saving cache for ${pokemonName}:`, error);
  }
};

// Helper function to get both cards from cache
export const getCachedCards = async (pokemonName: string): Promise<{ firstCard: TCGCard | null; secondCard: TCGCard | null }> => {
  try {
    const { data, error } = await supabase
      .from('tcg_cards_cache')
      .select('card_data, second_card_data, created_at')
      .eq('pokemon_name', pokemonName.toLowerCase())
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected for cache misses
        console.log(`🃏 [TCG_CACHE] No cached cards found for ${pokemonName}`);
        return { firstCard: null, secondCard: null };
      }
      console.error(`🃏 [TCG_CACHE] Error reading cache for ${pokemonName}:`, error);
      return { firstCard: null, secondCard: null };
    }
    
    if (!data) return { firstCard: null, secondCard: null };
    
    // Check if cache is expired
    const now = Date.now();
    const cacheTime = new Date(data.created_at).getTime();
    const expiryTime = cacheTime + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (now > expiryTime) {
      // Cache expired, remove it
      console.log(`🃏 [TCG_CACHE] Cache expired for ${pokemonName}, removing...`);
      await supabase
        .from('tcg_cards_cache')
        .delete()
        .eq('pokemon_name', pokemonName.toLowerCase());
      return { firstCard: null, secondCard: null };
    }
    
    console.log(`🃏 [TCG_CACHE] Found valid cached cards for ${pokemonName}`);
    return {
      firstCard: data.card_data as unknown as TCGCard,
      secondCard: data.second_card_data ? (data.second_card_data as unknown as TCGCard) : null
    };
  } catch (error) {
    console.error(`🃏 [TCG_CACHE] Error reading cache for ${pokemonName}:`, error);
    return { firstCard: null, secondCard: null };
  }
};
