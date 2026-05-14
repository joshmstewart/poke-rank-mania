
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
        <div className="container max-w-7xl mx-auto px-3 sm:px-6">
          {/* Mobile: 2 rows. Desktop: single row. */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:h-24 bg-card rounded-lg my-2 px-2 sm:px-4 py-2 gap-2 md:gap-4">
            {/* Row 1 (mobile) / Left (desktop) — Logo + right cluster */}
            <div className="flex items-center justify-between md:justify-start gap-2 min-w-0">
              <LogoSection />
              <div className="flex items-center gap-1 md:hidden">
                <ThemeToggle />
                <AuthStatusIndicator />
                <SaveProgressSection />
              </div>
            </div>

            {/* Row 2 (mobile) / Center (desktop) — Mode/Style controls, scrollable on tiny screens */}
            <div className="min-w-0 overflow-x-auto md:overflow-visible -mx-2 px-2 md:mx-0 md:px-0">
              <ModeStyleControls mode={mode} onModeChange={onModeChange} />
            </div>

            {/* Right cluster — desktop only */}
            <div className="hidden md:flex items-center gap-2">
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
