
import { generations } from "@/services/pokemon";

export const getPokemonGeneration = (pokemonId: number) => {
  return generations.find(
    (gen) => pokemonId >= gen.start && pokemonId <= gen.end && gen.id !== 0
  );
};

// Enhanced function to detect Pokémon form categories with standardized gender naming
export const detectPokemonFormType = (pokemonName: string): string | null => {
  const name = pokemonName.toLowerCase();
  
  // Check for costume forms (Pikachu variants) - check this FIRST
  if (name.includes("pikachu") && (
      name.includes("cap") || 
      name.includes("phd") || 
      name.includes("cosplay") || 
      name.includes("belle") || 
      name.includes("libre") || 
      name.includes("pop-star") || 
      name.includes("rock-star") ||
      name.includes("partner"))) {
    return "Costume Pokémon";
  }
  
  // Check for Origin and Primal forms
  if (name.includes("origin") || name.includes("primal")) {
    return "Origin & Primal Forms";
  }
  
  // Check for mega evolutions and gigantamax forms
  if (name.includes("mega")) {
    return "Mega Evolution";
  }
  
  if (name.includes("gmax")) {
    return "Gigantamax Form";
  }
  
  // Check for regional variants
  if (name.includes("alolan")) {
    return "Alolan Form";
  }
  
  if (name.includes("galarian")) {
    return "Galarian Form";
  }
  
  if (name.includes("hisuian")) {
    return "Hisuian Form";
  }
  
  if (name.includes("paldean")) {
    return "Paldean Form";
  }
  
  // Check for gender differences with standardized naming
  if (name.includes("female") || name.includes("-f")) {
    return "Female Form (Female)";
  }
  
  if (name.includes("male") || name.includes("-m")) {
    return "Male Form (Male)";
  }
  
  // Check for other special forms
  if (name.includes("form") || 
      name.includes("style") || 
      name.includes("mode") || 
      name.includes("size") || 
      name.includes("cloak") ||
      name.includes("rotom-") ||
      name.includes("forme") ||
      name.includes("unbound") ||
      name.includes("gorging") ||
      name.includes("eternamax") ||
      name.includes("-theme")) {
    return "Special Form";
  }
  
  return null;
};
