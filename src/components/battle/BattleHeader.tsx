import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface BattleHeaderProps {
  battlesCompleted: number;
  onGoBack: () => void;
  hasHistory: boolean;
  isProcessing: boolean;
  internalProcessing: boolean;
}

const BattleHeader: React.FC<BattleHeaderProps> = ({
  battlesCompleted,
  onGoBack,
  hasHistory,
  isProcessing,
  internalProcessing
}) => {
  // We'll keep the component but make it render nothing
  // This allows us to keep the component interface intact for other components that might use it
  // but not display the redundant header
  return null;
};

export default BattleHeader;
