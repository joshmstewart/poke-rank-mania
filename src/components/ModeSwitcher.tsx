
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
        <div className="bg-white border-2 border-primary/20 p-1.5 rounded-xl flex items-center shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onModeChange("battle")}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 font-semibold ${
                  currentMode === "battle"
                    ? "bg-primary text-white shadow-lg transform scale-105 border-2 border-primary"
                    : "hover:bg-primary/10 text-gray-600 hover:text-primary border-2 border-transparent"
                }`}
                aria-label="Battle Mode"
              >
                <Trophy className={`h-5 w-5 ${currentMode === "battle" ? "text-white" : "text-primary"}`} />
                <span className="text-sm">Battle</span>
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
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 font-semibold ${
                  currentMode === "rank"
                    ? "bg-primary text-white shadow-lg transform scale-105 border-2 border-primary"
                    : "hover:bg-primary/10 text-gray-600 hover:text-primary border-2 border-transparent"
                }`}
                aria-label="Manual Mode"
              >
                <DraftingCompass className={`h-5 w-5 ${currentMode === "rank" ? "text-white" : "text-primary"}`} />
                <span className="text-sm">Manual</span>
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
