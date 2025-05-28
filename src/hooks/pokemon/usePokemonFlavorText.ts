
import { useState, useEffect } from "react";

export const usePokemonFlavorText = (pokemonId: number, isOpen: boolean) => {
  const [flavorText, setFlavorText] = useState<string>("");
  const [isLoadingFlavor, setIsLoadingFlavor] = useState(false);

  // Get base Pokemon ID for variant forms
  const getBasePokemonId = (pokemonId: number) => {
    if (pokemonId > 1025) {
      return Math.min(pokemonId, 1025);
    }
    return pokemonId;
  };

  useEffect(() => {
    if (isOpen && !flavorText && !isLoadingFlavor) {
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
          console.error('Failed to fetch flavor text:', error);
          setFlavorText("Description not available.");
        })
        .finally(() => {
          setIsLoadingFlavor(false);
        });
    }
  }, [isOpen, pokemonId, flavorText, isLoadingFlavor]);

  return { flavorText, isLoadingFlavor };
};
