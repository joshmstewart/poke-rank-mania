import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { getPreferredImage, ImageType } from "@/utils/imageUtils";
import { Loader2 } from "lucide-react";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: BattleType;
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const BattleCard: React.FC<BattleCardProps> = memo(({
  pokemon,
  isSelected,
  battleType,
  onSelect,
  isProcessing = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localImageLoading, setLocalImageLoading] = useState(true);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);

  console.log(`🎯 [LOADING CIRCLES] BattleCard ${pokemon.name} received isProcessing: ${isProcessing}`);
  
  // CRITICAL FIX: Don't hide Pokemon during processing - show loading overlay instead
  if (isProcessing) {
    console.log(`🟡 [LOADING CIRCLES] BattleCard ${pokemon.name} SHOWING loading state`);
  } else {
    console.log(`🟢 [LOADING CIRCLES] BattleCard ${pokemon.name} NOT showing loading state`);
  }

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setLocalImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setLocalImageLoading(false);
    console.error(`Failed to load image for ${pokemon.name}`);
  }, [pokemon.name]);

  const handleClick = useCallback(() => {
    const now = Date.now();
    
    // Prevent rapid double-clicks
    if (now - lastClickTimeRef.current < 300) {
      console.log(`🚫 BattleCard: Ignoring rapid click on ${pokemon.name}`);
      return;
    }
    
    lastClickTimeRef.current = now;
    
    // CRITICAL FIX: Don't block clicks during processing - let parent handle
    console.log(`🖱️ BattleCard: Click on ${pokemon.name} (${pokemon.id}) - processing: ${isProcessing}`);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(pokemon.id);
      clickTimeoutRef.current = null;
    }, 50);
  }, [pokemon.id, pokemon.name, onSelect, isProcessing]);

  const preferredImageType: ImageType = 
    (localStorage.getItem('preferredImageType') as ImageType) || 'official';
  
  console.log(`🖼️ [DEV] Getting preferred image type: ${preferredImageType}`);
  
  const imageUrl = getPreferredImage(pokemon, preferredImageType);
  
  console.log(`🏆 BattleCard: Rendering Pokemon ${pokemon.name} (#${pokemon.id}) with isSelected=${isSelected}`);
  console.log(`🖼️ BattleCard: Loading "${preferredImageType}" image for ${pokemon.name} (#${pokemon.id}): ${imageUrl}`);

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform hover:scale-105 
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
  `.trim();

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={pokemon.name}
      data-processing={isProcessing ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* CRITICAL FIX: Keep Pokemon visible, add loading overlay instead */}
        <div className="relative">
          {/* Pokemon Image */}
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
              alt={pokemon.name}
              className={`w-full h-full object-contain rounded-lg transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="eager"
            />
          </div>

          {/* Pokemon Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-gray-800">{pokemon.name}</h3>
            <p className="text-sm text-gray-600">#{pokemon.id}</p>
            
            {pokemon.types && pokemon.types.length > 0 && (
              <div className="flex justify-center gap-1 mt-2">
                {pokemon.types.map((type, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white type-${type.toLowerCase()}`}
                    style={{
                      backgroundColor: getTypeColor(type)
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CRITICAL FIX: Loading overlay that keeps Pokemon visible */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <span className="text-sm text-gray-600">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Helper function to get type colors
const getTypeColor = (type: string): string => {
  const typeColors: Record<string, string> = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };
  
  return typeColors[type.toLowerCase()] || '#68A090';
};

BattleCard.displayName = "BattleCard";

export default BattleCard;
