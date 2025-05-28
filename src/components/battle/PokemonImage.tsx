
import React, { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface PokemonImageProps {
  imageUrl: string;
  displayName: string;
  pokemonId: number;
}

const PokemonImage: React.FC<PokemonImageProps> = ({ 
  imageUrl, 
  displayName, 
  pokemonId 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    console.error(`Failed to load image for ${displayName}`);
  }, [displayName]);

  return (
    <div className="relative w-32 h-32 mx-auto mb-3">
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <span className="text-gray-400 text-sm">No Image</span>
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={displayName}
        className={`w-full h-full object-contain rounded-lg transition-opacity duration-200 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="eager"
      />
    </div>
  );
};

export default PokemonImage;
