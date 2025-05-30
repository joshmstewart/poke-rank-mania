
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type RankingMode = "battle" | "manual";

interface RankingModeSelectorProps {
  currentMode: RankingMode;
  onModeChange: (mode: RankingMode) => void;
}

const RankingModeSelector: React.FC<RankingModeSelectorProps> = ({
  currentMode,
  onModeChange
}) => {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium whitespace-nowrap">Mode:</span>
      <Select value={currentMode} onValueChange={onModeChange}>
        <SelectTrigger className="w-[200px] h-8 text-sm">
          <SelectValue placeholder="Select mode" />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="battle">Battle Mode</SelectItem>
          <SelectItem value="manual">Manual Mode</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default RankingModeSelector;
