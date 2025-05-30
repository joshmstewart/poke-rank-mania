
import React, { useState, useEffect } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import AppSessionManager from "@/components/AppSessionManager";
import Logo from "@/components/ui/Logo";
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

const Index = () => {
  const [mode, setMode] = useState<"rank" | "battle">(() => {
    // Try to load from localStorage or default to battle
    const savedMode = localStorage.getItem('pokemon-ranker-mode');
    return (savedMode === "rank" || savedMode === "battle") ? savedMode : "battle";
  });
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [currentImageMode, setCurrentImageMode] = useState<'pokemon' | 'tcg'>('pokemon');

  // Save mode preference when it changes
  useEffect(() => {
    localStorage.setItem('pokemon-ranker-mode', mode);
  }, [mode]);

  // Handle mode change
  const handleModeChange = (newMode: "rank" | "battle") => {
    setMode(newMode);
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Application Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 relative">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-24">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <div className="h-24 flex items-center py-2 px-4">
                <img 
                  src="/lovable-uploads/008c1959-1f2a-4416-9d73-9f706e384331.png" 
                  alt="PokeRank Mania" 
                  className="h-16 w-auto object-contain"
                  style={{ height: '64px', width: 'auto' }}
                />
              </div>
            </div>
            
            {/* Center - Mode and Style Controls Group */}
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-2 shadow-sm border border-gray-100">
              {/* Mode Switcher */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ModeSwitcher currentMode={mode} onModeChange={handleModeChange} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Switch between Battle mode (head-to-head comparisons) and Manual mode (drag & drop ranking)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Vertical Divider */}
              <div className="h-8 w-px bg-gray-200"></div>
              
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
                    <DialogContent className="max-w-2xl">
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
            
            {/* Right side - Save Progress */}
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <AppSessionManager />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Save your progress and rankings to continue later</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto py-6">
        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </main>
    </div>
  );
};

export default Index;
