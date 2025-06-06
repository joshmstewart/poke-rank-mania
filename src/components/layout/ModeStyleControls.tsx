
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpButton } from "@/components/tour/HelpButton";

interface ModeStyleControlsProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const ModeStyleControls: React.FC<ModeStyleControlsProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center justify-center gap-3" data-tour="mode-switcher">
      <Tabs value={mode} onValueChange={(value) => onModeChange(value as "rank" | "battle")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="battle" data-tour="battle-mode-tab">Battle Mode</TabsTrigger>
          <TabsTrigger value="rank" data-tour="manual-ranking-tab">Manual Ranking</TabsTrigger>
        </TabsList>
      </Tabs>
      <HelpButton />
    </div>
  );
};

export default ModeStyleControls;
