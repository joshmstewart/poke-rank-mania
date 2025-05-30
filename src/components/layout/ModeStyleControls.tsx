
import React, { useState, useEffect } from "react";
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
import { getPreferredImageUrl, getCurrentImageMode } from "@/components/settings/imagePreferenceHelpers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Pikachu ID for preview
const PIKACHU_ID = 25;

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
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [currentImageMode, setCurrentImageMode] = useState<'pokemon' | 'tcg'>('pokemon');

  // Load preview image and current mode when component mounts or when settings change
  useEffect(() => {
    const updatePreviewImage = () => {
      const imageMode = getCurrentImageMode();
      setCurrentImageMode(imageMode);
      
      let newUrl = '';
      if (imageMode === 'tcg') {
        // Use a Pikachu TCG card image for TCG mode
        newUrl = 'https://images.pokemontcg.io/base1/58_hires.png';
      } else {
        // Use regular Pikachu artwork for Pokemon mode
        newUrl = getPreferredImageUrl(PIKACHU_ID);
      }
      
      setPreviewImageUrl(newUrl);
      setPreviewLoaded(false); // Reset loaded state when URL changes
    };

    updatePreviewImage();

    // Listen for storage changes to update preview if another tab changes the preference
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pokemon-image-preference" || e.key === "pokemon-image-mode") {
        updatePreviewImage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Remove imageSettingsOpen from dependency array

  // Listen for changes when dialog closes
  useEffect(() => {
    if (!imageSettingsOpen) {
      // Small delay to ensure localStorage has been updated
      setTimeout(() => {
        const imageMode = getCurrentImageMode();
        setCurrentImageMode(imageMode);
        
        let newUrl = '';
        if (imageMode === 'tcg') {
          newUrl = 'https://images.pokemontcg.io/base1/58_hires.png';
        } else {
          newUrl = getPreferredImageUrl(PIKACHU_ID);
        }
        
        setPreviewImageUrl(newUrl);
        setPreviewLoaded(false);
      }, 100);
    }
  }, [imageSettingsOpen]);

  // Get current mode display text and icon
  const getCurrentModeText = () => {
    return currentImageMode === 'tcg' ? 'TCG Cards' : 'Images';
  };

  const getCurrentModeIcon = () => {
    return currentImageMode === 'tcg' ? CreditCard : Image;
  };

  const CurrentIcon = getCurrentModeIcon();

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
                    {previewImageUrl && previewLoaded && (
                      <img 
                        src={previewImageUrl}
                        alt="Current style preview"
                        className="w-full h-full object-contain rounded-sm"
                        onLoad={() => setPreviewLoaded(true)}
                        onError={() => {
                          console.error('Failed to load preview image:', previewImageUrl);
                          setPreviewLoaded(false);
                        }}
                      />
                    )}
                    {(!previewImageUrl || !previewLoaded) && (
                      <CurrentIcon className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{getCurrentModeText()}</span>
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
