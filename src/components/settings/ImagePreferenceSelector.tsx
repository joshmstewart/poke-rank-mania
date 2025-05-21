
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Sample Pokémon ID to show as example
const SAMPLE_POKEMON_ID = 25; // Pikachu

// Image type options
export type PokemonImageType = "default" | "official" | "home" | "dream";

interface ImageTypeOption {
  id: PokemonImageType;
  name: string;
  url: (id: number) => string;
  description: string;
}

const imageTypeOptions: ImageTypeOption[] = [
  {
    id: "default",
    name: "Default Sprite",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    description: "Simple pixel art sprite from the games"
  },
  {
    id: "official",
    name: "Official Artwork",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
    description: "High quality official artwork"
  },
  {
    id: "home",
    name: "Home Artwork",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`,
    description: "Modern 3D style from Pokémon Home"
  },
  {
    id: "dream",
    name: "Dream World",
    url: (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${id}.svg`,
    description: "Vector artwork from Dream World (SVG format)"
  }
];

// Get the preferred image type from local storage
export const getPreferredImageType = (): PokemonImageType => {
  const stored = localStorage.getItem("pokemon-image-preference");
  console.log("🖼️ Getting preferred image type from localStorage:", stored);
  if (stored && (stored === "default" || stored === "official" || stored === "home" || stored === "dream")) {
    return stored;
  }
  console.log("🖼️ No valid preference found, defaulting to official");
  return "official"; // Default to official artwork
};

// Get URL for preferred image type with fallback support
export const getPreferredImageUrl = (pokemonId: number, fallbackLevel?: number): string => {
  const preference = getPreferredImageType();
  console.log(`🖼️ Getting image for Pokémon #${pokemonId} with preference: ${preference}, fallback: ${fallbackLevel}`);
  
  // Direct function to get URL for a specific type
  const getUrlForType = (type: PokemonImageType): string => {
    const option = imageTypeOptions.find(opt => opt.id === type);
    return option ? option.url(pokemonId) : imageTypeOptions[1].url(pokemonId);
  };
  
  // If fallbackLevel is provided, use it to determine which fallback to try
  if (fallbackLevel !== undefined && fallbackLevel > 0) {
    // List of all image types for fallbacks
    const allTypes: PokemonImageType[] = ["official", "home", "default", "dream"];
    
    // Remove the preferred type from the list since it was already tried
    let fallbackTypes = allTypes.filter(type => type !== preference);
    
    // Add the preferred type at the end as a last resort
    fallbackTypes.push(preference);
    
    // Get the appropriate fallback
    const fallbackIndex = Math.min(fallbackLevel - 1, fallbackTypes.length - 1);
    const fallbackType = fallbackTypes[fallbackIndex];
    
    console.log(`🖼️ Using fallback #${fallbackLevel}: ${fallbackType}`);
    return getUrlForType(fallbackType);
  }
  
  // No fallback specified, just use preferred type
  console.log(`🖼️ Using primary preference: ${preference}`);
  return getUrlForType(preference);
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

  const handleImageLoad = (id: string) => {
    setImagesLoaded(prev => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

const handleSave = () => {
  localStorage.setItem("pokemon-image-preference", selectedImageType);
  toast.success("Image preference saved!", {
    description: "Your preferred Pokémon image style has been saved."
  });
  window.dispatchEvent(new Event("imagePreferenceChanged"));
  if (onClose) onClose();
};


  const selectOption = (optionId: PokemonImageType) => {
    setSelectedImageType(optionId);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Choose Preferred Pokémon Image Style</CardTitle>
        <CardDescription>
          Select which style of Pokémon images you prefer to see throughout the app
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
                  src={option.url(SAMPLE_POKEMON_ID)} 
                  alt={`${option.name} example`}
                  className={`w-full h-full object-contain ${imagesLoaded[option.id] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
                  onLoad={() => handleImageLoad(option.id)}
                  onError={() => handleImageError(option.id)}
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
