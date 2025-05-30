
import React from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { ImageMode } from './types';
import { imageModeOptions } from './imagePreferenceData';

interface ImageModeSelectorProps {
  selectedMode: ImageMode;
  onModeChange: (mode: ImageMode) => void;
  imageLoadStates: Record<string, boolean>;
  onImageLoad: (id: string) => void;
  onImageError: (id: string) => void;
}

const ImageModeSelector: React.FC<ImageModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  imageLoadStates,
  onImageLoad,
  onImageError
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Battle Mode</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {imageModeOptions.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <Card
              key={mode.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedMode === mode.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onModeChange(mode.id)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">{mode.name}</h4>
                  </div>
                  {selectedMode === mode.id && (
                    <Check className="w-4 h-4 text-primary mt-0.5" />
                  )}
                </div>
                
                <div className="flex justify-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                    <img
                      src={mode.previewImage}
                      alt={`${mode.name} preview`}
                      className={`max-w-full max-h-full object-contain transition-opacity ${
                        imageLoadStates[mode.id] ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => onImageLoad(mode.id)}
                      onError={() => onImageError(mode.id)}
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 text-center">{mode.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ImageModeSelector;
