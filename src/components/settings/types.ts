
import React from 'react';

export type ImageType = 'official' | 'artwork' | 'sprite' | 'tcg-cards';
export type ImageMode = 'pokemon' | 'tcg';

// Legacy types for backward compatibility
export type PokemonImageType = 'official' | 'home' | 'dream' | 'default';

export interface ImageOption {
  id: ImageType;
  name: string;
  description: string;
  previewUrl: string;
}

export interface ImageModeOption {
  id: ImageMode;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  previewImage: string;
}

export interface ImagePreferenceSelectorProps {
  onClose?: () => void;
}
