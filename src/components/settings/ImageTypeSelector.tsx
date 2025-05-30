
import React from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { ImageType } from './types';
import { imageTypeOptions } from './imagePreferenceData';

interface ImageTypeSelectorProps {
  selectedType: ImageType;
  onTypeChange: (type: ImageType) => void;
  imageLoadStates: Record<string, boolean>;
  onImageLoad: (id: string) => void;
  onImageError: (id: string) => void;
}

const ImageTypeSelector: React.FC<ImageTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  imageLoadStates,
  onImageLoad,
  onImageError
}) => {
  return (
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
            onClick={() => onTypeChange(option.id)}
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
                    onLoad={() => onImageLoad(option.id)}
                    onError={() => onImageError(option.id)}
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-600 text-center">{option.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ImageTypeSelector;
