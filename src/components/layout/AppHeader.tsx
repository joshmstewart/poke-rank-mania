
import React from "react";
import LogoSection from "./LogoSection";
import ModeStyleControls from "./ModeStyleControls";
import { SaveProgressSection } from "./SaveProgressSection";
import { LastSyncDisplay } from "./LastSyncDisplay";
import { AuthStatusIndicator } from "./AuthStatusIndicator";
import { ThemeToggle } from "./ThemeToggle";

interface AppHeaderProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ mode, onModeChange }) => {
  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 relative">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-24 bg-card rounded-lg mx-2 my-2 px-4">
            {/* Left side - Logo */}
            <LogoSection />
            
            {/* Center - Mode and Style Controls Group */}
            <ModeStyleControls mode={mode} onModeChange={onModeChange} />
            
            {/* Right side - Clean Save Progress Section */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthStatusIndicator />
              <SaveProgressSection />
            </div>
          </div>
        </div>
      </header>
      <LastSyncDisplay />
    </>
  );
};

export default AppHeader;
