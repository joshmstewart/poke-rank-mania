
import { PokemonFormType } from "@/hooks/form-filters/types";

// Helper to get friendly filter name
export const getFilterName = (filter: PokemonFormType): string => {
  switch (filter) {
    case "normal": return "Normal Pokémon";
    case "megaGmax": return "Mega & Gigantamax Forms";
    case "regional": return "Regional Variants";
    case "gender": return "Gender Differences";
    case "forms": return "Special Forms";
    case "originPrimal": return "Origin & Primal Forms";
    case "costumes": return "Costume Pokémon";
    case "colorsFlavors": return "Colors & Flavors";
    case "blocked": return "Blocked Pokémon";
  }
};
