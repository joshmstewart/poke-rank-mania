
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ImageModeSelector from './ImageModeSelector';
import ImageTypeSelector from './ImageTypeSelector';
import TCGModeInfo from './TCGModeInfo';
import { ImageType, ImageMode, ImagePreferenceSelectorProps } from './types';

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
      <ImageModeSelector
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        imageLoadStates={imageLoadStates}
        onImageLoad={handleImageLoad}
        onImageError={handleImageError}
      />

      {/* Image Type Selection - Only show for Pokemon mode */}
      {selectedMode === 'pokemon' && (
        <ImageTypeSelector
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          imageLoadStates={imageLoadStates}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
        />
      )}

      {selectedMode === 'tcg' && <TCGModeInfo />}

      {onClose && (
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Done</Button>
        </div>
      )}
    </div>
  );
};

export default ImagePreferenceSelector;
