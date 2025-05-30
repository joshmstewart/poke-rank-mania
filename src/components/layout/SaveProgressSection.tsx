
import React from "react";
import AppSessionManager from "@/components/AppSessionManager";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SaveProgressSection: React.FC = () => {
  return (
    <div className="flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <AppSessionManager />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Save your progress and rankings to continue later</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SaveProgressSection;
