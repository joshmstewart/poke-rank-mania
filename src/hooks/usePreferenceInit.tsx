import { useEffect } from "react";
import { PokemonImageType } from "@/components/settings/types";

/**
 * Hook to initialize user preferences early in the application lifecycle
 * This ensures preferences are set before components that need them render
 */
export const usePreferenceInit = () => {
  useEffect(() => {
    const POKEMON_IMAGE_PREFERENCE_KEY = "pokemon-image-preference";
    const DEFAULT_IMAGE_PREFERENCE: PokemonImageType = "official";
    
    // Check if image preference exists, set default if not
    const storedImagePreference = localStorage.getItem(POKEMON_IMAGE_PREFERENCE_KEY);
    const isValidPreference = storedImagePreference === "default" || 
                              storedImagePreference === "official" || 
                              storedImagePreference === "home" || 
                              storedImagePreference === "dream";
    
    if (!storedImagePreference || !isValidPreference) {
      localStorage.setItem(POKEMON_IMAGE_PREFERENCE_KEY, DEFAULT_IMAGE_PREFERENCE);
      console.log(`🖼️ App Init: Default image preference set to "${DEFAULT_IMAGE_PREFERENCE}"`);
    } else {
      console.log(`🖼️ App Init: Found existing image preference: "${storedImagePreference}"`);
    }
  }, []);
};

export default usePreferenceInit;
