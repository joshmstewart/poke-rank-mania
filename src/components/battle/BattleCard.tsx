import React, { memo, useCallback, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { MousePointerClick } from "lucide-react";
import { getPreferredImageUrl } from "@/components/settings/ImagePreferenceSelector";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: "pairs" | "triplets";
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

// Use memo to prevent unnecessary re-renders
const BattleCard: React.FC<BattleCardProps> = memo(({
  pokemon,
  isSelected,
  battleType,
  onSelect,
  isProcessing = false
}) => {
  // Add image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const maxRetries = 3;

  // Reset image states and use preferred image type when pokemon changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    
    // Always start with the preferred image type from settings
    const preferredImageUrl = getPreferredImageUrl(pokemon.id);
    setCurrentImageUrl(preferredImageUrl);
    
    // Preload the image
    const preloadImage = new Image();
    preloadImage.src = preferredImageUrl;
  }, [pokemon.id, pokemon.image]);

  // Create a stable click handler using useCallback
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Skip if processing
    if (isProcessing) {
      console.log(`BattleCard: Click ignored for ${pokemon.name} because processing is in progress`);
      return;
    }
    
    console.log(`BattleCard: Clicked Pokemon: ${pokemon.id}, ${pokemon.name}`);
    onSelect(pokemon.id);
  }, [pokemon.id, pokemon.name, onSelect, isProcessing]);

  // Handle image load success
  const handleImageLoad = () => {
    console.log(`Image loaded for Pokemon: ${pokemon.name}`);
    setImageLoaded(true);
    setImageError(false);
  };

  // Handle image load error with improved fallback logic
  const handleImageError = () => {
    if (retryCount < maxRetries) {
      console.log(`Image error for Pokemon: ${pokemon.name}, trying fallback #${retryCount + 1}`);
      setRetryCount(prev => prev + 1);
      setImageError(true);
      
      // Try next fallback using the image utility function
      const nextUrl = getPreferredImageUrl(pokemon.id, retryCount + 1);
      console.log(`Trying fallback URL: ${nextUrl} for ${pokemon.name}`);
      setCurrentImageUrl(nextUrl);
    } else {
      console.log(`All fallbacks failed for Pokemon: ${pokemon.name}`);
      setImageError(true);
    }
  };

  // Determine card styling based on selection and processing state
  const cardStyles = `
    cursor-pointer 
    h-full 
    transform 
    transition-all 
    ${isSelected ? "ring-4 ring-primary" : ""} 
    ${isProcessing ? "opacity-70 pointer-events-none" : "hover:scale-105"}
  `;

  return (
    <Card 
      className={cardStyles}
      onClick={handleCardClick}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      aria-disabled={isProcessing}
      data-testid={`battle-card-${pokemon.id}`}
    >
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-32 h-32 relative flex items-center justify-center">
            {!imageLoaded && !imageError && (
              <div className="animate-pulse bg-gray-200 w-full h-full absolute rounded-md"></div>
            )}
            <img 
              src={currentImageUrl} 
              alt={pokemon.name} 
              className={`w-full h-full object-contain mb-4 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`} 
              loading="eager"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {imageError && retryCount >= maxRetries && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 rounded-md">
                <div className="text-center text-gray-600 p-2">
                  <div className="font-medium">{pokemon.name}</div>
                  <div>#{pokemon.id}</div>
                </div>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold">{pokemon.name}</h3>
          <p className="text-gray-500">#{pokemon.id}</p>
          
          {pokemon.types && pokemon.types.length > 0 && (
            <div className="flex gap-2 mt-2">
              {pokemon.types.map((type, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs rounded-full bg-gray-100"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
          
          {/* Status indicator with clearer processing state */}
          <div className="mt-4 px-3 py-2 bg-gray-100 rounded flex items-center justify-center w-full">
            {isProcessing ? (
              <div className="text-sm flex items-center gap-1 text-amber-600">
                <MousePointerClick size={16} className="animate-pulse" />
                Processing...
              </div>
            ) : battleType === "pairs" ? (
              <div className="text-sm flex items-center gap-1 text-primary">
                <MousePointerClick size={16} />
                Click to select
              </div>
            ) : (
              <div className={`text-sm ${isSelected ? "font-bold text-primary" : ""}`}>
                {isSelected ? "Selected" : "Click to select"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BattleCard.displayName = "BattleCard";

export default BattleCard;
