
import { useCallback } from "react";
import { Pokemon } from "@/services/pokemon";

export const useTypeExtraction = () => {
  const extractPokemonTypes = useCallback((pokemon: Pokemon): { type1: string; type2: string | null } => {
    console.log(`[DEBUG Type Extraction] Pokemon ${pokemon.name} (${pokemon.id}) raw types:`, JSON.stringify(pokemon.types));
    
    if (!pokemon.types || !Array.isArray(pokemon.types) || pokemon.types.length === 0) {
      console.log(`[DEBUG Type Extraction] No valid types found for ${pokemon.name} - returning default`);
      return { type1: 'unknown', type2: null };
    }

    const extractedTypes: string[] = [];

    for (let i = 0; i < pokemon.types.length; i++) {
      const typeSlot = pokemon.types[i];
      
      if (!typeSlot) continue;

      // Handle string types directly
      if (typeof typeSlot === 'string') {
        extractedTypes.push(typeSlot);
        continue;
      }

      // Handle object types with nested structure: { slot: 1, type: { name: 'grass' } }
      if (typeof typeSlot === 'object') {
        const slotAsAny = typeSlot as any;
        if (slotAsAny && slotAsAny.type && typeof slotAsAny.type === 'object' && typeof slotAsAny.type.name === 'string') {
          extractedTypes.push(slotAsAny.type.name);
          continue;
        }

        // Handle direct name structure: { name: 'grass' }
        if (slotAsAny && typeof slotAsAny.name === 'string') {
          extractedTypes.push(slotAsAny.name);
          continue;
        }
      }
    }

    const type1 = extractedTypes.length > 0 ? extractedTypes[0] : 'unknown';
    const type2 = extractedTypes.length > 1 ? extractedTypes[1] : null;
    
    console.log(`[DEBUG Type Extraction] Final types for ${pokemon.name}: type1=${type1}, type2=${type2}`);
    return { type1, type2 };
  }, []);

  return { extractPokemonTypes };
};
