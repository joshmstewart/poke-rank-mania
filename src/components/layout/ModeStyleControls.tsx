
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModeStyleControlsProps {
  mode: "rank" | "battle";
  onModeChange: (newMode: "rank" | "battle") => void;
}

const ModeStyleControls: React.FC<ModeStyleControlsProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center justify-center" data-tour="mode-switcher">
      <Tabs value={mode} onValueChange={(value) => onModeChange(value as "rank" | "battle")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="battle">Battle Mode</TabsTrigger>
          <TabsTrigger value="rank">Manual Ranking</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ModeStyleControls;
