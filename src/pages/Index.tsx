
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
import { Image, Trophy, DraftingCompass } from "lucide-react";
import ImagePreferenceSelector, { getPreferredImageUrl, getCurrentImageMode } from "@/components/settings/ImagePreferenceSelector";
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
      
      // Always load Pikachu preview image regardless of mode
      const url = getPreferredImageUrl(PIKACHU_ID);
      setPreviewImageUrl(url);
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

  // Get current mode display text
  const getCurrentModeText = () => {
    return currentImageMode === 'tcg' ? 'TCG Card' : 'Image';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo />
              <div className="flex items-center gap-3">
                {mode === "battle" ? (
                  <Trophy className="h-5 w-5 text-primary" />
                ) : (
                  <DraftingCompass className="h-5 w-5 text-primary" />
                )}
                <div>
                  <h1 className="text-lg font-bold leading-none">
                    {mode === "battle" ? "Battle Mode" : "Manual Ranking"}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mode === "battle" 
                      ? "Compare Pokémon head-to-head to build your ranking" 
                      : "Drag and drop to manually create your ranking"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mode Switcher */}
              <ModeSwitcher currentMode={mode} onModeChange={handleModeChange} />
              
              {/* Image Style Dialog */}
              <TooltipProvider>
                <Tooltip>
                  <Dialog open={imageSettingsOpen} onOpenChange={setImageSettingsOpen}>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex gap-2 items-center h-8">
                          <div className="flex items-center justify-center w-4 h-4 relative">
                            {!previewLoaded && (
                              <Image className="w-3 h-3 text-gray-400" />
                            )}
                            {previewImageUrl && (
                              <img 
                                src={previewImageUrl}
                                alt="Current style"
                                className={`w-full h-full object-contain ${previewLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setPreviewLoaded(true)}
                                onError={() => { /* Keep showing icon on error */ }}
                              />
                            )}
                          </div>
                          <span className="hidden sm:inline text-xs">{getCurrentModeText()}</span>
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      Choose between Pokémon images or TCG cards for battles
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
                        
                        // Always load Pikachu preview regardless of mode
                        setPreviewImageUrl(getPreferredImageUrl(PIKACHU_ID));
                        setPreviewLoaded(false);
                      }} />
                    </DialogContent>
                  </Dialog>
                </Tooltip>
              </TooltipProvider>
              
              {/* Combined Save Progress / Session Manager */}
              <AppSessionManager />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto py-4">
        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </div>
    </div>
  );
};

export default Index;
