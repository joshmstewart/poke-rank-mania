
import React, { useState, useEffect, useCallback, useMemo } from "react";
import ModeSwitcher from "@/components/ModeSwitcher";
import { 
  Dialog,
  DialogContent, 
  DialogTitle, 
  DialogDescription, 
  DialogHeader,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, Image, CreditCard } from "lucide-react";
import ImagePreferenceSelector from "@/components/settings/ImagePreferenceSelector";
import { getCurrentImageMode } from "@/components/settings/imagePreferenceHelpers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePreviewImageCache } from "@/hooks/usePreviewImageCache";

interface ModeStyleControlsProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const ModeStyleControls: React.FC<ModeStyleControlsProps> = ({
  mode,
  onModeChange
}) => {
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [currentImageMode, setCurrentImageMode] = useState<'pokemon' | 'tcg'>('pokemon');
  
  const { getPreviewImage, isLoading, imageStates, updateImageState } = usePreviewImageCache();

  // Memoize the update function to prevent dependency changes
  const updatePreviewImage = useCallback(async () => {
    const imageMode = getCurrentImageMode();
    setCurrentImageMode(imageMode);
    
    console.log(`🖼️ [MODE_CONTROLS] Updating preview image for mode: ${imageMode}`);
    
    try {
      const newUrl = await getPreviewImage(imageMode);
      setPreviewImageUrl(newUrl);
      console.log(`🖼️ [MODE_CONTROLS] Set preview URL: ${newUrl}`);
    } catch (error) {
      console.error('Failed to get preview image:', error);
    }
  }, [getPreviewImage]);

  // Initial load - only run once on mount
  useEffect(() => {
    updatePreviewImage();
  }, [updatePreviewImage]);

  // Listen for storage changes from other tabs - stable dependencies
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pokemon-image-preference" || e.key === "pokemon-image-mode") {
        updatePreviewImage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updatePreviewImage]);

  // Handle dialog close updates - FIXED: Only run when dialog actually closes
  useEffect(() => {
    if (!imageSettingsOpen) {
      // Use a ref or flag to prevent running on initial mount
      const timeoutId = setTimeout(async () => {
        const imageMode = getCurrentImageMode();
        setCurrentImageMode(imageMode);
        
        try {
          const newUrl = await getPreviewImage(imageMode);
          setPreviewImageUrl(newUrl);
          console.log(`🖼️ [MODE_CONTROLS] Dialog closed, updated preview URL: ${newUrl}`);
        } catch (error) {
          console.error('Failed to update preview image after dialog close:', error);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [imageSettingsOpen, getPreviewImage]); // Only depend on dialog state and the stable getPreviewImage

  // Get current mode display text and icon - memoized to prevent re-renders
  const modeDisplay = useMemo(() => {
    const text = currentImageMode === 'tcg' ? 'TCG Cards' : 'Images';
    const IconComponent = currentImageMode === 'tcg' ? CreditCard : Image;
    return { text, IconComponent };
  }, [currentImageMode]);

  // Get image state for current preview - with proper defaults and memoization
  const imageDisplayState = useMemo(() => {
    const currentImageState = imageStates[previewImageUrl];
    const imageLoaded = currentImageState?.loaded ?? false;
    const imageError = currentImageState?.error ?? false;
    
    // Determine if we should show the preview image or fallback icon
    const hasValidUrl = previewImageUrl && previewImageUrl.length > 0;
    const shouldShowPreviewImage = hasValidUrl && !imageError;
    const shouldShowFallbackIcon = !hasValidUrl || imageError;

    return {
      imageLoaded,
      imageError,
      shouldShowPreviewImage,
      shouldShowFallbackIcon
    };
  }, [previewImageUrl, imageStates]);

  // Stable image load/error handlers
  const handleImageLoad = useCallback(() => {
    console.log('✅ [MODE_CONTROLS] Preview image loaded successfully:', previewImageUrl);
    updateImageState(previewImageUrl, true, false);
  }, [previewImageUrl, updateImageState]);

  const handleImageError = useCallback(() => {
    console.error('❌ [MODE_CONTROLS] Failed to load preview image:', previewImageUrl);
    updateImageState(previewImageUrl, false, true);
  }, [previewImageUrl, updateImageState]);

  return (
    <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-2 shadow-md border-2 border-gray-400">
      {/* Mode Switcher */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ModeSwitcher currentMode={mode} onModeChange={onModeChange} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Switch between Battle mode (head-to-head comparisons) and Manual mode (drag & drop ranking)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Vertical Divider */}
      <div className="h-8 w-px bg-gray-300"></div>
      
      {/* Image Style Button */}
      <TooltipProvider>
        <Tooltip>
          <Dialog open={imageSettingsOpen} onOpenChange={setImageSettingsOpen}>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex gap-2 items-center h-9 px-4 hover:bg-white/70 transition-colors">
                  <div className="flex items-center justify-center w-5 h-5 relative">
                    {imageDisplayState.shouldShowPreviewImage && (
                      <img 
                        src={previewImageUrl}
                        alt="Current style preview"
                        className={`w-full h-full object-contain rounded-sm transition-opacity duration-200 ${
                          imageDisplayState.imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    )}
                    {imageDisplayState.shouldShowFallbackIcon && (
                      <modeDisplay.IconComponent className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{modeDisplay.text}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Choose between Pokémon artwork and TCG card images for battles</p>
            </TooltipContent>
            <DialogContent className="max-w-2xl z-[10005]">
              <DialogHeader>
                <DialogTitle>Battle Style Preferences</DialogTitle>
                <DialogDescription>
                  Choose how you want to see and battle with Pokémon.
                </DialogDescription>
              </DialogHeader>
              <ImagePreferenceSelector onClose={() => {
                setImageSettingsOpen(false);
              }} />
            </DialogContent>
          </Dialog>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ModeStyleControls;
