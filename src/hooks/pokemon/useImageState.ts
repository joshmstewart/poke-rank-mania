import { useState, useRef } from "react";
import { getPreferredImageUrl, getPreferredImageType } from "@/components/settings/imagePreferenceHelpers";
import { PokemonImageType } from "@/components/settings/types";

export const useImageState = (pokemonId: number) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [currentImageType, setCurrentImageType] = useState<PokemonImageType>(getPreferredImageType());
  
  // Use refs to track image loading state across renders
  const initialUrlRef = useRef<string>("");
  const hasInitialLoadRef = useRef<boolean>(false);
  const imageLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isMountedRef = useRef(true);

  const initializeImage = () => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    
    const preference = getPreferredImageType();
    setCurrentImageType(preference);
    
    const url = getPreferredImageUrl(pokemonId);
    setCurrentImageUrl(url);
    initialUrlRef.current = url;
    hasInitialLoadRef.current = true;
  };

  return {
    imageLoaded,
    imageError,
    retryCount,
    currentImageUrl,
    currentImageType,
    initialUrlRef,
    hasInitialLoadRef,
    imageLoadingTimerRef,
    imgRef,
    isMountedRef,
    setImageLoaded,
    setImageError,
    setRetryCount,
    setCurrentImageUrl,
    setCurrentImageType,
    initializeImage
  };
};
