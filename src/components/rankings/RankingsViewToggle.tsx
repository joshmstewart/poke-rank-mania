
import React from "react";
import { Button } from "@/components/ui/button";

interface RankingsViewToggleProps {
  activeView: "personal" | "global";
  onViewChange: (view: "personal" | "global") => void;
}

const RankingsViewToggle: React.FC<RankingsViewToggleProps> = ({
  activeView,
  onViewChange
}) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <Button
        variant={activeView === "personal" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("personal")}
        className="h-8 px-4"
      >
        Your Rankings
      </Button>
      <Button
        variant={activeView === "global" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("global")}
        className="h-8 px-4"
      >
        Global Rankings
      </Button>
    </div>
  );
};

export default RankingsViewToggle;
