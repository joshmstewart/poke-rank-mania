
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

  // Load preview image and current mode when component mounts
  useEffect(() => {
    const updatePreviewImage = () => {
      const imageMode = getCurrentImageMode();
      setCurrentImageMode(imageMode);
      
      if (imageMode === 'tcg') {
        // Use a Pikachu TCG card image for TCG mode
        setPreviewImageUrl('https://images.pokemontcg.io/base1/58_hires.png');
      } else {
        // Use regular Pikachu artwork for Pokemon mode
        const url = getPreferredImageUrl(PIKACHU_ID);
        setPreviewImageUrl(url);
      }
      setPreviewLoaded(false);
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
  }, []);

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
                    {previewImageUrl ? (
                      <img 
                        src={previewImageUrl}
                        alt="Current style preview"
                        className={`w-full h-full object-contain rounded-sm ${previewLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setPreviewLoaded(true)}
                        onError={() => { /* Keep showing on error */ }}
                      />
                    ) : (
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
                // Update preview after closing
                const imageMode = getCurrentImageMode();
                setCurrentImageMode(imageMode);
                
                if (imageMode === 'tcg') {
                  setPreviewImageUrl('https://images.pokemontcg.io/base1/58_hires.png');
                } else {
                  setPreviewImageUrl(getPreferredImageUrl(PIKACHU_ID));
                }
                setPreviewLoaded(false);
              }} />
            </DialogContent>
          </Dialog>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ModeStyleControls;
