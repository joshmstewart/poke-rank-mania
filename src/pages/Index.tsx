
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
import ImagePreferenceSelector, { getPreferredImageUrl, getImageTypeOptions } from "@/components/settings/ImagePreferenceSelector";
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

  // Save mode preference when it changes
  useEffect(() => {
    localStorage.setItem('pokemon-ranker-mode', mode);
  }, [mode]);

  // Handle mode change
  const handleModeChange = (newMode: "rank" | "battle") => {
    setMode(newMode);
  };

  // Load preview image when component mounts
  useEffect(() => {
    const updatePreviewImage = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-shrink-0">
            <Logo />
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
                      <Button variant="outline" size="sm" className="flex gap-2 items-center h-9">
                        <div className="flex items-center justify-center w-5 h-5 relative">
                          {!previewLoaded && (
                            <Image className="w-4 h-4 text-gray-400" />
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
                        <span className="hidden sm:inline">Battle Style</span>
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
                      setPreviewImageUrl(getPreferredImageUrl(PIKACHU_ID));
                      setPreviewLoaded(false);
                    }} />
                  </DialogContent>
                </Dialog>
              </Tooltip>
            </TooltipProvider>
            
            <AppSessionManager />
          </div>
        </div>

        {/* Mode Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {mode === "battle" ? (
                <Trophy className="h-6 w-6 text-primary" />
              ) : (
                <DraftingCompass className="h-6 w-6 text-primary" />
              )}
              <h1 className="text-2xl font-bold">
                {mode === "battle" ? "Battle Mode" : "Manual Ranking"}
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground">
            {mode === "battle" 
              ? "Compare Pokémon head-to-head to determine your personal ranking. Your choices will be used to generate a personalized tier list." 
              : "Drag and drop Pokémon to manually create and order your personal ranking list. Perfect for fine-tuning after battles."}
          </p>
        </div>

        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </div>
    </div>
  );
};

export default Index;
