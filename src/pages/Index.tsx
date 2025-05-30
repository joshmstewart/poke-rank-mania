
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
import { Image, ChevronDown } from "lucide-react";
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
    return currentImageMode === 'tcg' ? 'TCG Cards' : 'Images';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Application Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 relative">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <div className="h-48 flex items-center py-4 px-4">
                <img 
                  src="/lovable-uploads/008c1959-1f2a-4416-9d73-9f706e384331.png" 
                  alt="PokeRank Mania" 
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
            
            {/* Right side - Controls grouped together */}
            <div className="flex items-center gap-3">
              {/* Mode and Style Controls Group */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                {/* Mode Switcher */}
                <ModeSwitcher currentMode={mode} onModeChange={handleModeChange} />
                
                {/* Image Style Button */}
                <TooltipProvider>
                  <Tooltip>
                    <Dialog open={imageSettingsOpen} onOpenChange={setImageSettingsOpen}>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex gap-2 items-center h-8 px-3 hover:bg-white">
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
                            <span className="text-sm">{getCurrentModeText()}</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        Choose between Pokémon images or TCG cards
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
              </div>
              
              {/* Save Progress - separate action */}
              <div className="border-l border-gray-200 pl-3">
                <AppSessionManager />
              </div>
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
