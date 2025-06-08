
import React from "react";
import LogoSection from "./LogoSection";
import ModeStyleControls from "./ModeStyleControls";
import { SaveProgressSection } from "./SaveProgressSection";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useTutorial } from "@/components/help/TutorialManager";

interface AppHeaderProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ mode, onModeChange }) => {
  console.log('🔥🔥🔥 AppHeader: HEADER IS RENDERING - this should ALWAYS appear');
  console.log('🔥🔥🔥 AppHeader: Current mode:', mode);
  console.log('🔥🔥🔥 AppHeader: Timestamp:', new Date().toISOString());

  const { startTutorial } = useTutorial();

  const handleHelpClick = () => {
    startTutorial(0);
  };

  return (
    <header className="bg-white border-b-2 border-gray-300 shadow-md sticky top-0 z-50 relative">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24 bg-white rounded-lg mx-2 my-2 px-4">
          {/* Left side - Logo */}
          <LogoSection />
          
          {/* Center - Mode and Style Controls Group */}
          <div data-tutorial="mode-controls">
            <ModeStyleControls mode={mode} onModeChange={onModeChange} />
          </div>
          
          {/* Right side - Help and Save Progress Section */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleHelpClick}
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
            <div data-tutorial="save-progress">
              <SaveProgressSection />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
