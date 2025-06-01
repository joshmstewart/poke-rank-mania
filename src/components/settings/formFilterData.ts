
import { PokemonFormType } from "@/hooks/form-filters/types";

// Image URLs for different form types
export const formExampleImages: Record<PokemonFormType, string> = {
  normal: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png", // Pikachu
  regional: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10091.png", // Alolan Muk
  gender: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/593.png", // Female Jellicent
  forms: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10120.png", // Hoopa Unbound
  megaGmax: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png", // Mega Charizard Y
  originPrimal: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10007.png", // Giratina Origin
  costumes: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10094.png", // Pikachu with Original Cap
  colorsFlavors: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/774.png", // Minior (represents color variants)
  blocked: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png", // Bulbasaur (represents blocked starter)
};
