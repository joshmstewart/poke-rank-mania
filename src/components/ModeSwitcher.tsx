
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, DraftingCompass } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface ModeSwitcherProps {
  currentMode: "rank" | "battle";
  onModeChange: (mode: "rank" | "battle") => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, onModeChange }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <Tabs defaultValue={currentMode} onValueChange={(value) => onModeChange(value as "rank" | "battle")}>
          <TabsList className="grid grid-cols-2 h-9">
            <TooltipTrigger asChild>
              <TabsTrigger 
                value="battle" 
                className={`flex items-center gap-1 px-3 text-xs ${
                  currentMode === "battle" 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : ""
                }`}
              >
                <Trophy className={`h-3.5 w-3.5 ${currentMode === "battle" ? "text-primary-foreground" : ""}`} />
                <span className="hidden sm:inline">Battle</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipTrigger asChild>
              <TabsTrigger 
                value="rank" 
                className={`flex items-center gap-1 px-3 text-xs ${
                  currentMode === "rank" 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : ""
                }`}
              >
                <DraftingCompass className={`h-3.5 w-3.5 ${currentMode === "rank" ? "text-primary-foreground" : ""}`} />
                <span className="hidden sm:inline">Rank</span>
              </TabsTrigger>
            </TooltipTrigger>
          </TabsList>
        </Tabs>
        <TooltipContent side="bottom" align="center">
          <p>{currentMode === "battle" ? "Battle Mode: Compare head-to-head" : "Manual Ranking: Drag to reorder"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ModeSwitcher;
