
import { useState, useEffect } from "react";
import { getBasePokemonId } from "@/utils/pokemon/pokemonGenerationUtils";

export const usePokemonFlavorText = (pokemonId: number, isOpen: boolean) => {
  const [flavorText, setFlavorText] = useState<string>("");
  const [isLoadingFlavor, setIsLoadingFlavor] = useState(false);

  // Reset flavor text when Pokemon changes - this must run every time
  useEffect(() => {
    setFlavorText("");
    setIsLoadingFlavor(false);
  }, [pokemonId]);

  // Fetch flavor text when modal opens
  useEffect(() => {
    if (isOpen && !flavorText && !isLoadingFlavor && pokemonId) {
      setIsLoadingFlavor(true);
      const baseId = getBasePokemonId(pokemonId);
      
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${baseId}`)
        .then(res => res.json())
        .then(data => {
          const englishEntries = data.flavor_text_entries?.filter(
            (entry: any) => entry.language.name === 'en'
          );
          
          if (englishEntries && englishEntries.length > 0) {
            const latestEntry = englishEntries[englishEntries.length - 1];
            const cleanText = latestEntry.flavor_text
              .replace(/\f/g, ' ')
              .replace(/\n/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            setFlavorText(cleanText);
          }
        })
        .catch(error => {
          console.error(`Failed to fetch flavor text for Pokemon ID: ${pokemonId}:`, error);
          setFlavorText("Description not available.");
        })
        .finally(() => {
          setIsLoadingFlavor(false);
        });
    }
  }, [isOpen, pokemonId, flavorText, isLoadingFlavor]);

  return { flavorText, isLoadingFlavor };
};
