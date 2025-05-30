
import React from "react";
import LogoSection from "./LogoSection";
import ModeStyleControls from "./ModeStyleControls";
import SaveProgressSection from "./SaveProgressSection";

interface AppHeaderProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ mode, onModeChange }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 relative">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24">
          {/* Left side - Logo */}
          <LogoSection />
          
          {/* Center - Mode and Style Controls Group */}
          <ModeStyleControls mode={mode} onModeChange={onModeChange} />
          
          {/* Right side - Save Progress */}
          <SaveProgressSection />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
