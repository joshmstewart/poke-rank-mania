import React, { memo, useCallback, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { getPreferredImageUrl } from "@/components/settings/ImagePreferenceSelector";
import { formatPokemonName } from "@/utils/pokemonUtils";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: "pairs" | "triplets";
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const BattleCard: React.FC<BattleCardProps> = memo(({ pokemon, isSelected, onSelect, isProcessing = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const formattedName = formatPokemonName(pokemon.name);

  const updateImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    const preferredType = localStorage.getItem('pokemon-image-preference') || 'official';
const url = getPreferredImageUrl(pokemon.id);



    setCurrentImageUrl(url);
    new Image().src = url;
  }, [pokemon.id]);

  useEffect(() => {
    updateImage();
    const handlePreferenceChange = () => updateImage();
    window.addEventListener("imagePreferenceChanged", handlePreferenceChange);
    return () => window.removeEventListener("imagePreferenceChanged", handlePreferenceChange);
  }, [updateImage]);

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => {
    if (retryCount < 3) {
      setRetryCount(c => c + 1);
      setCurrentImageUrl(getPreferredImageUrl(pokemon.id, retryCount + 1));
    } else {
      setImageError(true);
    }
  };

  const handleClick = useCallback(() => {
    if (!isProcessing) onSelect(pokemon.id);
  }, [pokemon.id, onSelect, isProcessing]);

  return (
    <Card className={`cursor-pointer transition-transform ${isSelected ? "ring-4 ring-primary" : ""} ${isProcessing ? "opacity-70" : "hover:scale-105"}`} onClick={handleClick}>
      <CardContent className="flex flex-col items-center p-4">
        <div className="w-32 h-32 relative">
          {!imageLoaded && !imageError && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md"></div>}
          <img
            src={currentImageUrl}
            alt={formattedName}
            className={`w-full h-full object-contain transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageError && <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-xs">{formattedName}</div>}
        </div>
        <h3 className="mt-2 text-xl font-bold">{formattedName}</h3>
      </CardContent>
    </Card>
  );
});

BattleCard.displayName = "BattleCard";
export default BattleCard;
