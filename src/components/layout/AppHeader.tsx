
import React from "react";
import LogoSection from "./LogoSection";
import ModeStyleControls from "./ModeStyleControls";
import SaveProgressSection from "./SaveProgressSection";

interface AppHeaderProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ mode, onModeChange }) => {
  console.log('🟢🟢🟢 AppHeader: ALWAYS FIRES - Header component is rendering');
  console.log('🟢🟢🟢 AppHeader: Timestamp:', new Date().toISOString());

  return (
    <header className="bg-white border-b-2 border-gray-300 shadow-md sticky top-0 z-50 relative">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24 bg-white rounded-lg mx-2 my-2 px-4">
          {/* Left side - Logo */}
          <LogoSection />
          
          {/* Center - Mode and Style Controls Group */}
          <ModeStyleControls mode={mode} onModeChange={onModeChange} />
          
          {/* Right side - ONLY SaveProgressSection (no other auth components) */}
          <div className="bg-blue-200 border-2 border-blue-600 p-2">
            <div className="text-xs text-blue-800 mb-1">DEBUG: HEADER RIGHT SIDE</div>
            <SaveProgressSection />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
