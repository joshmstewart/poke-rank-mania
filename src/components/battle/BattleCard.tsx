import React, { memo, useCallback, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { MousePointerClick } from "lucide-react";
import { getPreferredImageUrl, getPreferredImageType } from "@/components/settings/ImagePreferenceSelector";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: "pairs" | "triplets";
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const BattleCard: React.FC<BattleCardProps> = memo(({ pokemon, isSelected, battleType, onSelect, isProcessing = false }) => {
  const [preferredImageType, setPreferredImageType] = useState(getPreferredImageType());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");

  useEffect(() => {
    const updateImage = () => {
      setImageLoaded(false);
      setImageError(false);
      setRetryCount(0);
      const url = getPreferredImageUrl(pokemon.id);
      setCurrentImageUrl(url);
      new Image().src = url;
    };
    updateImage();
  }, [pokemon.id, preferredImageType]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pokemon-image-preference") {
        setPreferredImageType(getPreferredImageType());
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => {
    if (retryCount < 3) {
      setRetryCount(c => c + 1);
      const nextUrl = getPreferredImageUrl(pokemon.id, retryCount + 1);
      setCurrentImageUrl(nextUrl);
    } else {
      setImageError(true);
    }
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) onSelect(pokemon.id);
  }, [pokemon.id, onSelect, isProcessing]);

  return (
    <Card className={`cursor-pointer transition-transform ${isSelected ? "ring-4 ring-primary" : ""} ${isProcessing ? "opacity-70" : "hover:scale-105"}`} onClick={handleClick}>
      <CardContent className="flex flex-col items-center p-4">
        <div className="w-32 h-32 relative">
          {!imageLoaded && !imageError && <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md"></div>}
          <img
            src={currentImageUrl}
            alt={pokemon.name}
            className={`w-full h-full object-contain transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {imageError && <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-xs">{pokemon.name}</div>}
        </div>
        <h3 className="mt-2 text-xl font-bold">{pokemon.name}</h3>
      </CardContent>
    </Card>
  );
});

BattleCard.displayName = "BattleCard";
export default BattleCard;
