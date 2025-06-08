
import React from "react";
import ModeSwitcher from "@/components/ModeSwitcher";
import UnifiedControls from "@/components/shared/UnifiedControls";

interface ModeStyleControlsProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const ModeStyleControls: React.FC<ModeStyleControlsProps> = ({ mode, onModeChange }) => {
  console.log('🔥🔥🔥 ModeStyleControls: RENDERING - mode:', mode);
  console.log('🔥🔥🔥 ModeStyleControls: Timestamp:', new Date().toISOString());

  // Default generation and handler for UnifiedControls
  const handleGenerationChange = (generation: string) => {
    console.log('Generation changed to:', generation);
    // This will be handled by the generation state management
  };

  return (
    <div className="flex items-center gap-4">
      {/* Mode Switcher with tutorial attributes */}
      <div className="flex items-center">
        <div data-tutorial="battle-button">
          <ModeSwitcher 
            currentMode={mode} 
            onModeChange={onModeChange}
          />
        </div>
        <div data-tutorial="rank-button">
          {/* The rank button is part of the ModeSwitcher, but we can add this wrapper for targeting */}
        </div>
      </div>
      
      {/* Unified Controls with tutorial attributes */}
      <div data-tutorial="generation-filter">
        <UnifiedControls 
          selectedGeneration={0}
          onGenerationChange={handleGenerationChange}
          mode="battle"
        />
      </div>
    </div>
  );
};

export default ModeStyleControls;
