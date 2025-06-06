
import React from "react";
import LogoSection from "./LogoSection";
import ModeStyleControls from "./ModeStyleControls";
import { SaveProgressSection } from "./SaveProgressSection";
import HeaderImagePreferences from "./HeaderImagePreferences";

interface AppHeaderProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ mode, onModeChange }) => {
  console.log('🔥🔥🔥 AppHeader: HEADER IS RENDERING - this should ALWAYS appear');
  console.log('🔥🔥🔥 AppHeader: Current mode:', mode);
  console.log('🔥🔥🔥 AppHeader: Timestamp:', new Date().toISOString());

  return (
    <header className="bg-white border-b-2 border-gray-300 shadow-md sticky top-0 z-50 relative">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24 bg-white rounded-lg mx-2 my-2 px-4">
          {/* Left side - Logo */}
          <LogoSection />
          
          {/* Center - Mode and Style Controls Group */}
          <div className="flex items-center gap-6">
            <ModeStyleControls mode={mode} onModeChange={onModeChange} />
            
            {/* Image Preferences */}
            <div className="border-l border-gray-200 pl-6">
              <HeaderImagePreferences />
            </div>
          </div>
          
          {/* Right side - Clean Save Progress Section */}
          <div className="flex items-center">
            <SaveProgressSection />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
