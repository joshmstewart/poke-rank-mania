
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

export type ImageType = 'official' | 'artwork' | 'sprite' | 'tcg-cards';
export type ImageMode = 'pokemon' | 'tcg';

// Legacy types for backward compatibility
export type PokemonImageType = 'official' | 'home' | 'dream' | 'default';

interface ImageOption {
  id: ImageType;
  name: string;
  description: string;
  previewUrl: string;
}

interface ImageModeOption {
  id: ImageMode;
  name: string;
  description: string;
}

const imageModeOptions: ImageModeOption[] = [
  {
    id: 'pokemon',
    name: 'Pokémon Images',
    description: 'Classic Pokémon artwork and sprites'
  },
  {
    id: 'tcg',
    name: 'TCG Cards',
    description: 'Real Pokémon Trading Card Game cards'
  }
];

const imageTypeOptions: ImageOption[] = [
  {
    id: 'official',
    name: 'Official Artwork',
    description: 'High-quality official Pokémon artwork',
    previewUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'
  },
  {
    id: 'artwork',
    name: 'Dream World',
    description: 'Dream World style artwork',
    previewUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/25.svg'
  },
  {
    id: 'sprite',
    name: 'Classic Sprite',
    description: 'Retro pixel art sprites',
    previewUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
  }
];

interface ImagePreferenceSelectorProps {
  onClose?: () => void;
}

const ImagePreferenceSelector: React.FC<ImagePreferenceSelectorProps> = ({ onClose }) => {
  const [selectedMode, setSelectedMode] = useState<ImageMode>(() => {
    const stored = localStorage.getItem('pokemon-image-mode') as ImageMode | null;
    return stored || 'pokemon';
  });
  
  const [selectedType, setSelectedType] = useState<ImageType>(() => {
    const stored = localStorage.getItem('pokemon-image-preference') as ImageType | null;
    return stored || 'official';
  });

  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem('pokemon-image-mode', selectedMode);
  }, [selectedMode]);

  useEffect(() => {
    localStorage.setItem('pokemon-image-preference', selectedType);
  }, [selectedType]);

  const handleImageLoad = (id: string) => {
    setImageLoadStates(prev => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string) => {
    setImageLoadStates(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="space-y-6">
      {/* Image Mode Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Battle Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {imageModeOptions.map((mode) => (
            <Card
              key={mode.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedMode === mode.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMode(mode.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{mode.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{mode.description}</p>
                </div>
                {selectedMode === mode.id && (
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Image Type Selection - Only show for Pokemon mode */}
      {selectedMode === 'pokemon' && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Image Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {imageTypeOptions.map((option) => (
              <Card
                key={option.id}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedType === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedType(option.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{option.name}</h4>
                    {selectedType === option.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                      <img
                        src={option.previewUrl}
                        alt={`${option.name} preview`}
                        className={`max-w-full max-h-full object-contain transition-opacity ${
                          imageLoadStates[option.id] ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(option.id)}
                        onError={() => handleImageError(option.id)}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 text-center">{option.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedMode === 'tcg' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">TCG Card Mode</h4>
          <p className="text-sm text-blue-700">
            In this mode, you'll battle with real Pokémon Trading Card Game cards. 
            Cards will be loaded dynamically during battles for an authentic TCG experience.
          </p>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Done</Button>
        </div>
      )}
    </div>
  );
};

// Helper functions for getting preferred images
export const getImageModeOptions = () => imageModeOptions;
export const getImageTypeOptions = () => imageTypeOptions;

export const getPreferredImageUrl = (pokemonId: number): string => {
  const mode = localStorage.getItem('pokemon-image-mode') as ImageMode | null || 'pokemon';
  
  if (mode === 'tcg') {
    // For TCG mode, we'll return a placeholder since actual cards are loaded dynamically
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
  
  const preferredType = localStorage.getItem('pokemon-image-preference') as ImageType | null || 'official';
  
  switch (preferredType) {
    case 'official':
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
    case 'artwork':
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonId}.svg`;
    case 'sprite':
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
    default:
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
};

export const getCurrentImageMode = (): ImageMode => {
  return localStorage.getItem('pokemon-image-mode') as ImageMode | null || 'pokemon';
};

// Legacy function for backward compatibility
export const getPreferredImageType = (): PokemonImageType => {
  const preferredType = localStorage.getItem('pokemon-image-preference') as ImageType | null || 'official';
  
  // Map new types to legacy types
  switch (preferredType) {
    case 'official':
      return 'official';
    case 'artwork':
      return 'dream';
    case 'sprite':
      return 'default';
    default:
      return 'official';
  }
};

export default ImagePreferenceSelector;
