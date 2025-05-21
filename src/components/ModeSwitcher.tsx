
import React from "react";
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
      <div className="flex items-center">
        <div className="bg-gray-100 p-1 rounded-full flex items-center shadow-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onModeChange("battle")}
                className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 ${
                  currentMode === "battle"
                    ? "bg-primary text-white shadow-md transform scale-105"
                    : "hover:bg-gray-200"
                }`}
                aria-label="Battle Mode"
              >
                <Trophy className={`h-4 w-4 ${currentMode === "battle" ? "" : "text-gray-500"}`} />
                <span className="font-medium">Battle</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              <p>Battle Mode: Compare Pokémon head-to-head</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onModeChange("rank")}
                className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 ${
                  currentMode === "rank"
                    ? "bg-primary text-white shadow-md transform scale-105"
                    : "hover:bg-gray-200"
                }`}
                aria-label="Manual Mode"
              >
                <DraftingCompass className={`h-4 w-4 ${currentMode === "rank" ? "" : "text-gray-500"}`} />
                <span className="font-medium">Manual</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              <p>Manual Mode: Drag and reorder rankings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ModeSwitcher;
