
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, X } from "lucide-react";

interface WelcomeSplashProps {
  onStartTutorial: () => void;
  onSkip: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({
  onStartTutorial,
  onSkip
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome before
    const hasSeenWelcome = localStorage.getItem('pokemon-ranker-welcome-seen');
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleStartTutorial = () => {
    localStorage.setItem('pokemon-ranker-welcome-seen', 'true');
    setIsVisible(false);
    onStartTutorial();
  };

  const handleSkip = () => {
    localStorage.setItem('pokemon-ranker-welcome-seen', 'true');
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <Dialog open={isVisible} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Content */}
          <div className="p-8 text-center space-y-6">
            <div className="relative">
              <div className="text-6xl mb-4 animate-bounce">🎮</div>
              <Sparkles className="absolute top-0 right-12 h-6 w-6 animate-pulse" />
              <Sparkles className="absolute top-8 left-8 h-4 w-4 animate-pulse delay-150" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold">
                Welcome to Pokémon Ranker!
              </h1>
              <p className="text-lg text-blue-100">
                Discover your favorite Pokémon through epic battles and smart rankings
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-100">
                ✨ Battle Pokémon head-to-head
              </p>
              <p className="text-sm text-blue-100">
                📊 Smart algorithm learns your preferences
              </p>
              <p className="text-sm text-blue-100">
                🎯 Create personalized rankings
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={handleStartTutorial}
                className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold py-3 text-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Interactive Tutorial
              </Button>
              
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="w-full text-white hover:bg-white/20"
              >
                Skip Tutorial - Let's Battle!
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
