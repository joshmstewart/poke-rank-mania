
import { Pokemon } from "@/services/pokemon";

export const logPokemonVariations = (allPokemon: Pokemon[]) => {
  // Only run this in development
  if (process.env.NODE_ENV !== 'production') {
    console.log("========= POKEMON VARIATIONS ANALYSIS =========");
    
    // Special form patterns to check for
    const specialPatterns = [
      { name: "Mega & Gigantamax Forms", pattern: /(mega|gmax)/i },
      { name: "Alolan Forms", pattern: /alolan/i },
      { name: "Galarian Forms", pattern: /galarian/i },
      { name: "Hisuian Forms", pattern: /hisuian/i },
      { name: "Paldean Forms", pattern: /paldean/i },
      { name: "Origin & Primal Forms", pattern: /(origin|primal)/i },
      { name: "Costume Pokémon", pattern: /(pikachu.*cap|pikachu-belle|pikachu-libre|pikachu-phd|pikachu-pop-star|pikachu-rock-star|pikachu-cosplay)/i },
      { name: "Special Gender Forms", pattern: /(female|male|-f|-m)/i },
      { name: "Special Rotom Forms", pattern: /rotom-/i },
      { name: "Other Special Forms", pattern: /(form|style|mode|size|cloak|forme|unbound|gorging|eternamax|theme)/i }
    ];
    
    // Group Pokémon by special patterns
    const pokemonByVariation: Record<string, Pokemon[]> = {};
    
    // Initialize categories
    specialPatterns.forEach(pattern => {
      pokemonByVariation[pattern.name] = [];
    });
    
    // Add a category for standard Pokémon
    pokemonByVariation["Standard Pokémon"] = [];
    
    // Group each Pokémon into the appropriate category
    allPokemon.forEach(pokemon => {
      const name = pokemon.name.toLowerCase();
      let matched = false;
      
      for (const pattern of specialPatterns) {
        if (pattern.pattern.test(name)) {
          pokemonByVariation[pattern.name].push(pokemon);
          matched = true;
          break; // Assign to first matching category
        }
      }
      
      // If no special pattern matched, it's a standard Pokémon
      if (!matched) {
        pokemonByVariation["Standard Pokémon"].push(pokemon);
      }
    });
    
    // Log summary of variations
    console.log("VARIATION COUNTS:");
    Object.entries(pokemonByVariation).forEach(([variation, pokemonList]) => {
      console.log(`${variation}: ${pokemonList.length} Pokémon`);
      
      // For each category, log the first 10 examples (or all if fewer than 10)
      if (pokemonList.length > 0) {
        console.log(`  Examples: ${pokemonList.slice(0, 10).map(p => p.name).join(", ")}${pokemonList.length > 10 ? '...' : ''}`);
      }
    });
    
    // Additional type-based analysis
    const typeGroups: Record<string, Pokemon[]> = {};
    
    allPokemon.forEach(pokemon => {
      if (pokemon.types && pokemon.types.length > 0) {
        const primaryType = pokemon.types[0];
        if (!typeGroups[primaryType]) {
          typeGroups[primaryType] = [];
        }
        typeGroups[primaryType].push(pokemon);
      }
    });
    
    console.log("\nTYPE DISTRIBUTION:");
    Object.entries(typeGroups)
      .sort((a, b) => b[1].length - a[1].length) // Sort by count descending
      .forEach(([type, pokemonList]) => {
        console.log(`${type}: ${pokemonList.length} Pokémon`);
      });
    
    console.log("============================================");
  }
};
