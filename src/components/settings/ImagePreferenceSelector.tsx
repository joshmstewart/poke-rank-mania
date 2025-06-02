
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ImageModeSelector from './ImageModeSelector';
import ImageTypeSelector from './ImageTypeSelector';
import TCGModeInfo from './TCGModeInfo';
import { ImageType, ImageMode, ImagePreferenceSelectorProps } from './types';
import { useCloudPreferences } from '@/hooks/useCloudPreferences';

const ImagePreferenceSelector: React.FC<ImagePreferenceSelectorProps> = ({ onClose }) => {
  const { imagePreferences, updateImagePreferences, isInitialized } = useCloudPreferences();
  
  const [selectedMode, setSelectedMode] = useState<ImageMode>(() => {
    const stored = localStorage.getItem('pokemon-image-mode') as ImageMode | null;
    return stored || 'pokemon';
  });
  
  const [selectedType, setSelectedType] = useState<ImageType>(() => {
    const stored = localStorage.getItem('pokemon-image-preference') as ImageType | null;
    // Default to 'official' for any invalid types
    if (stored && ['official', 'artwork', 'sprite'].includes(stored)) {
      return stored as 'official' | 'artwork' | 'sprite';
    }
    return 'official';
  });

  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});

  // Update local state when cloud preferences are loaded
  useEffect(() => {
    if (isInitialized && imagePreferences) {
      console.log('🖼️ [IMAGE_PREFS] Cloud preferences loaded:', imagePreferences);
      setSelectedMode(imagePreferences.mode);
      // Ensure we only set valid types
      if (['official', 'artwork', 'sprite'].includes(imagePreferences.type)) {
        setSelectedType(imagePreferences.type as 'official' | 'artwork' | 'sprite');
      }
    }
  }, [imagePreferences, isInitialized]);

  // Update cloud when local state changes
  useEffect(() => {
    if (isInitialized) {
      updateImagePreferences({
        mode: selectedMode,
        type: selectedType
      });
    }
  }, [selectedMode, selectedType, isInitialized, updateImagePreferences]);

  const handleImageLoad = (id: string) => {
    setImageLoadStates(prev => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id: string) => {
    setImageLoadStates(prev => ({ ...prev, [id]: false }));
  };

  const handleDoneClick = () => {
    // Dispatch a custom event to notify components that preferences have been saved
    window.dispatchEvent(new CustomEvent('pokemon-preferences-saved', {
      detail: { mode: selectedMode, type: selectedType }
    }));
    
    if (onClose) {
      onClose();
    }
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
          <Button onClick={handleDoneClick}>Done</Button>
        </div>
      )}
    </div>
  );
};

export default ImagePreferenceSelector;
