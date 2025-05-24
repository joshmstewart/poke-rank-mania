
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Sample Pokémon ID to show as example
const SAMPLE_POKEMON_ID = 25; // Pikachu

// Image type options
export type PokemonImageType = "default" | "official" | "home" | "dream";

// Constants for localStorage
export const POKEMON_IMAGE_PREFERENCE_KEY = "pokemon-image-preference";
export const DEFAULT_IMAGE_PREFERENCE: PokemonImageType = "official";

interface ImageTypeOption {
  id: PokemonImageType;
  name: string;
  url: (id: number) => string;
  description: string;
  fallbackInfo: string; // Added to explain the fallback behavior
}

const imageTypeOptions: ImageTypeOption[] = [
  {
    id: "default",
    name: "Default Sprite",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    description: "Simple pixel art sprite from the games",
    fallbackInfo: "Most reliable option, used as final fallback for all styles"
  },
  {
    id: "official",
    name: "Official Artwork",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
    description: "High quality official artwork",
    fallbackInfo: "Falls back to: Dream World → Home → Default Sprites"
  },
  {
    id: "home",
    name: "Home Artwork",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
    description: "Modern 3D style from Pokémon Home",
    fallbackInfo: "Falls back to: Official → Dream World → Default Sprites"
  },
  {
    id: "dream",
    name: "Dream World",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`,
    description: "Vector artwork from Dream World (SVG format)",
    fallbackInfo: "Falls back to: Official → Home → Default Sprites"
  }
];

// Get the preferred image type from local storage
export const getPreferredImageType = (): PokemonImageType => {
  const stored = localStorage.getItem(POKEMON_IMAGE_PREFERENCE_KEY);
  
  // Only log during development or when debugging
  if (process.env.NODE_ENV === "development") {
    console.log("🖼️ [DEV] Getting preferred image type:", stored);
  }
  
  if (stored && (stored === "default" || stored === "official" || stored === "home" || stored === "dream")) {
    return stored;
  }
  
  return DEFAULT_IMAGE_PREFERENCE;
};

// Use direct import from utils file instead of require
// This function now forwards to getPokemonImageUrl in utils.ts
export const getPreferredImageUrl = (pokemonId: number, fallbackLevel?: number): string => {
  // Forward to utils.ts implementation via imported function (see import at bottom of file)
  return getPokemonImageUrl(pokemonId, fallbackLevel);
};

// Export image options for use elsewhere
export const getImageTypeOptions = () => imageTypeOptions;

interface ImagePreferenceSelectorProps {
  onClose?: () => void;
}

const ImagePreferenceSelector: React.FC<ImagePreferenceSelectorProps> = ({ onClose }) => {
  const [selectedImageType, setSelectedImageType] = useState<PokemonImageType>(getPreferredImageType());
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});

  const handleImageLoad = (id: string) => {
    setImagesLoaded(prev => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string) => {
    // Track retry attempts
    const currentAttempts = retryAttempts[id] || 0;
    
    if (currentAttempts < 2) {
      // Try with cache busting
      setRetryAttempts(prev => ({ ...prev, [id]: currentAttempts + 1 }));
      
      // Apply cache busting and retry
      const option = imageTypeOptions.find(opt => opt.id === id);
      if (option) {
        const cacheBustedUrl = `${option.url(SAMPLE_POKEMON_ID)}?_cb=${Date.now()}`;
        
        // Wait a moment before retrying
        setTimeout(() => {
          const img = document.getElementById(`img-${id}`) as HTMLImageElement;
          if (img) {
            console.log(`🔄 Retrying image ${id} with cache busting: ${cacheBustedUrl}`);
            img.src = cacheBustedUrl;
          }
        }, 500);
        
        return;
      }
    }
    
    // If out of retries, mark as error
    setImageErrors(prev => ({ ...prev, [id]: true }));
    
    // Mark this image as needing cache busting for future loads
    markImageAsNeedingCacheBusting(SAMPLE_POKEMON_ID, id as PokemonImageType);
  };

  const handleSave = () => {
    localStorage.setItem(POKEMON_IMAGE_PREFERENCE_KEY, selectedImageType);
    toast.success("Image preference saved!", {
      description: "Your preferred Pokémon image style has been saved."
    });
    
    // Dispatch event to inform components of the change
    const event = new Event("imagePreferenceChanged");
    window.dispatchEvent(event);
    
    if (onClose) onClose();
  };

  const selectOption = (optionId: PokemonImageType) => {
    setSelectedImageType(optionId);
  };

  // Reset loaded/error state if we switch to this component
  useEffect(() => {
    setImagesLoaded({});
    setImageErrors({});
    setRetryAttempts({});
  }, []);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Choose Preferred Pokémon Image Style</CardTitle>
        <CardDescription>
          Select which style of Pokémon images you prefer to see throughout the app.
          Each style has a custom fallback chain if the preferred image isn't available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {imageTypeOptions.map((option) => (
            <Button
              key={option.id}
              variant={selectedImageType === option.id ? "default" : "outline"}
              className={`h-auto p-4 flex flex-col items-center justify-start gap-3 w-full ${selectedImageType === option.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => selectOption(option.id)}
            >
              <div className="w-20 h-20 rounded bg-gray-100 overflow-hidden relative">
                {!imagesLoaded[option.id] && !imageErrors[option.id] && (
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-gray-200">
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                )}
                <img 
                  id={`img-${option.id}`}
                  src={option.url(SAMPLE_POKEMON_ID)} 
                  alt={`${option.name} example`}
                  className={`w-full h-full object-contain ${imagesLoaded[option.id] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
                  onLoad={() => handleImageLoad(option.id)}
                  onError={() => handleImageError(option.id)}
                  crossOrigin="anonymous"
                />
                {imageErrors[option.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <span className="text-xs text-red-500">Failed to load</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium">{option.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                <p className="text-xs text-blue-500 mt-1">{option.fallbackInfo}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave}>
          Save Preference
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImagePreferenceSelector;

// Fix circular dependency by importing at the bottom after exports
// This breaks the circular reference chain
import { getPokemonImageUrl, markImageAsNeedingCacheBusting } from "@/services/pokemon/api/utils";
