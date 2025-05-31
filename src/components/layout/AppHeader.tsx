
import React from "react";
import LogoSection from "./LogoSection";
import ModeStyleControls from "./ModeStyleControls";
import SaveProgressSection from "./SaveProgressSection";

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
          <ModeStyleControls mode={mode} onModeChange={onModeChange} />
          
          {/* Right side - VERY VISIBLE CONTAINER */}
          <div className="bg-blue-900 border-8 border-yellow-400 p-4">
            <div className="text-xl font-bold text-yellow-400 mb-2">🔵 HEADER RIGHT SIDE 🔵</div>
            <SaveProgressSection />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
