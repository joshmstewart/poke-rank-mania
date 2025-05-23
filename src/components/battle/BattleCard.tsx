import React, { memo, useCallback, useState, useEffect, useRef } from "react";
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
  const initialUrlRef = useRef<string>(""); // Using ref to ensure it doesn't change
  
  const formattedName = formatPokemonName(pokemon.name);

  const updateImage = useCallback(() => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    const preference = getPreferredImageType();
    setCurrentImageType(preference);
    
    // Generate URL first, then set it to make sure we capture it
    const url = getPreferredImageUrl(pokemon.id);
    setCurrentImageUrl(url);
    initialUrlRef.current = url; // Store initial URL in ref
    
    // Log only during development or if explicitly debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`🖼️ BattleCard: Loading "${preference}" image for ${formattedName} (#${pokemon.id}): ${url}`);
      
      // Always verify if URL exists on server
      if (url && url.trim() !== '') {
        fetch(url, { method: 'HEAD' })
          .then(response => {
            if (!response.ok) {
              console.warn(`⚠️ BattleCard image URL check: ${url} returned status ${response.status}`);
            } else {
              console.log(`✅ BattleCard image URL check: ${url} exists on server`);
            }
          })
          .catch(error => {
            console.warn(`⚠️ BattleCard image URL check failed for ${url}: ${error.message}`);
          });
      } else {
        console.warn(`⚠️ BattleCard: Empty URL generated for ${formattedName} (#${pokemon.id})`);
      }
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
    // Get the failing URL
    const failedUrl = currentImageUrl || initialUrlRef.current;
    
    if (retryCount === 0) {
      if (!failedUrl || failedUrl.trim() === '') {
        // If URL is empty or undefined
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${formattedName} (#${pokemon.id}) failed. No URL was available for the preferred style.`);
      } else {
        // Log the initial failure with the actual URL
        console.error(`🔴 Initial attempt to load '${currentImageType}' artwork for ${formattedName} (#${pokemon.id}) failed. URL: ${failedUrl}`);
        
        // Additional diagnostic: Check if the URL exists on server with fetch HEAD
        fetch(failedUrl, { method: 'HEAD' })
          .then(response => {
            if (!response.ok) {
              console.error(`🔴 Confirmed: URL ${failedUrl} returned ${response.status} from server`);
            } else {
              console.error(`❓ Unexpected: URL ${failedUrl} exists on server but image still failed to load`);
            }
          })
          .catch(error => {
            console.error(`🔴 Network error checking ${failedUrl}: ${error.message}`);
          });
      }
    }
    
    if (retryCount < 3) { // Keep up to 3 retries to handle the new longer fallback chain
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
