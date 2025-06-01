
import { PokemonFormType } from "../types";

// Blocked Pokemon (totem, size variants, special modes, etc.)
export const blockedPokemonCategories: Record<string, PokemonFormType> = {
  // Size variants
  "pumpkaboo-small": "blocked",
  "pumpkaboo-large": "blocked",
  "pumpkaboo-super": "blocked",
  "gourgeist-small": "blocked",
  "gourgeist-large": "blocked",
  "gourgeist-super": "blocked",

  // Totem Pokemon
  "raticate-totem-alola": "blocked",
  "gumshoos-totem": "blocked",
  "vikavolt-totem": "blocked",
  "lurantis-totem": "blocked",
  "salazzle-totem": "blocked",
  "mimikyu-totem-disguised": "blocked",
  "mimikyu-totem-busted": "blocked",
  "kommo-o-totem": "blocked",
  "marowak-totem": "blocked",
  "ribombee-totem": "blocked",
  "araquanid-totem": "blocked",
  "togedemaru-totem": "blocked",

  // Meteor forms
  "minior-orange-meteor": "blocked",
  "minior-yellow-meteor": "blocked",
  "minior-green-meteor": "blocked",
  "minior-blue-meteor": "blocked",
  "minior-indigo-meteor": "blocked",
  "minior-violet-meteor": "blocked",
  "minior-red-meteor": "blocked",

  // Starter variants
  "pikachu-starter": "blocked",
  "eevee-starter": "blocked",

  // Special modes
  "rockruff-own-tempo": "blocked",
  "cramorant-gulping": "blocked",
  "cramorant-gorging": "blocked",
  "koraidon-limited-build": "blocked",
  "koraidon-sprinting-build": "blocked",
  "koraidon-swimming-build": "blocked",
  "koraidon-gliding-build": "blocked",
  "miraidon-low-power-mode": "blocked",
  "miraidon-drive-mode": "blocked",
  "miraidon-aquatic-mode": "blocked",
  "miraidon-glide-mode": "blocked",

  // Blocked special forms
  "greninja-battle-bond": "blocked"
};
