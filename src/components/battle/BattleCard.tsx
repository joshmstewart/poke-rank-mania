
import React, { memo, useCallback, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { getPreferredImageUrl, getPreferredImageType, PokemonImageType } from "@/components/settings/ImagePreferenceSelector";
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
  const [currentImageType, setCurrentImageType] = useState<PokemonImageType>(getPreferredImageType());
  const [initialUrl, setInitialUrl] = useState(""); // Store the initial URL for error reporting

  const formattedName = formatPokemonName(pokemon.name);

  const updateImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    const preference = getPreferredImageType();
    setCurrentImageType(preference);
    const url = getPreferredImageUrl(pokemon.id);
    setCurrentImageUrl(url);
    setInitialUrl(url); // Store initial URL for error reporting
    
    if (process.env.NODE_ENV === "development") {
      console.log(`🖼️ BattleCard: Loading "${preference}" image for ${formattedName} (#${pokemon.id}): ${url}`);
      
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.warn(`⚠️ BattleCard image URL check: ${url} returned status ${response.status}`);
          }
        })
        .catch(error => {
          console.warn(`⚠️ BattleCard image URL check failed for ${url}: ${error.message}`);
        });
    }
  }, [pokemon.id, formattedName]);

  useEffect(() => {
    updateImage();
    const handlePreferenceChange = () => updateImage();
    window.addEventListener("imagePreferenceChanged", handlePreferenceChange);
    return () => window.removeEventListener("imagePreferenceChanged", handlePreferenceChange);
  }, [updateImage]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    if (retryCount > 0 && process.env.NODE_ENV === "development") {
      console.log(`✅ Successfully loaded fallback image (type: ${currentImageType}) for ${formattedName} in battle`);
    }
  };
  
  const handleImageError = () => {
    if (retryCount === 0) {
      // Log the initial failure of the preferred image type with the actual URL
      console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${formattedName} (#${pokemon.id}) failed. URL: ${initialUrl}`);
    }
    
    if (retryCount < 3) {
      const nextRetry = retryCount + 1;
      const nextUrl = getPreferredImageUrl(pokemon.id, nextRetry);
      
      console.log(`❌ Battle image load failed for ${formattedName} (#${pokemon.id}) with type "${currentImageType}" - trying fallback #${nextRetry}: ${nextUrl}`);
      
      setRetryCount(nextRetry);
      setCurrentImageUrl(nextUrl);
    } else {
      console.error(`⛔ All image fallbacks failed for ${formattedName} in battle`);
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
