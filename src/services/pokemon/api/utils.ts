import { Pokemon } from "../types";

/**
 * Validates and ensures Pokemon have consistent image URLs and names for battle display
 */
export const validateBattlePokemon = (pokemon: Pokemon[]): Pokemon[] => {
  console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Input Pokemon count: ${pokemon.length}`);
  
  const validated = pokemon.map((p, index) => {
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Input #${index}: "${p.name}" (ID: ${p.id})`);
    
    // CRITICAL FIX: DO NOT modify the name - use it exactly as provided from the API
    const validatedPokemon = {
      ...p,
      // Keep the name exactly as it was formatted by the API
      name: p.name,
      // Ensure image exists
      image: p.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
    };
    
    console.log(`🔍 [VALIDATE_BATTLE_POKEMON] Output #${index}: "${validatedPokemon.name}" (ID: ${validatedPokemon.id})`);
    
    return validatedPokemon;
  });
  
  console.log(`✅ [VALIDATE_BATTLE_POKEMON] Validated ${validated.length} Pokemon - names preserved exactly as input`);
  return validated;
};
