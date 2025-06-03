
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RankingsViewToggle from "./RankingsViewToggle";
import GlobalRankingsView from "./GlobalRankingsView";
import PersonalRankingsView from "./PersonalRankingsView";

interface CombinedRankingsModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGeneration: number;
}

const CombinedRankingsModal: React.FC<CombinedRankingsModalProps> = ({
  children,
  open,
  onOpenChange,
  selectedGeneration
}) => {
  const [activeView, setActiveView] = useState<"personal" | "global">("personal");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Combined Rankings</h1>
            <RankingsViewToggle 
              activeView={activeView} 
              onViewChange={setActiveView} 
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {activeView === "global" ? (
            <GlobalRankingsView selectedGeneration={selectedGeneration} />
          ) : (
            <PersonalRankingsView selectedGeneration={selectedGeneration} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CombinedRankingsModal;
