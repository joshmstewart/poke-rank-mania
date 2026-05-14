
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

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
  const currentBattle = battlesCompleted + 1;
  const combinedProcessing = isProcessing || internalProcessing;

  // Keyboard shortcut: Cmd/Ctrl+Z to undo last battle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
        if (!hasHistory || combinedProcessing) return;
        e.preventDefault();
        onGoBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasHistory, combinedProcessing, onGoBack]);

  return (
    <div className="flex items-center justify-between mb-2">
      {/* Left side - Current battle info - more compact */}
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-foreground">
          Battle {currentBattle}
        </div>
        <div className="text-sm text-muted-foreground">
          Completed: {battlesCompleted}
        </div>
      </div>

      {/* Right side - Back button */}
      <div className="flex items-center">
        {hasHistory && (
          <Button
            onClick={onGoBack}
            variant="outline"
            size="sm"
            disabled={combinedProcessing}
            className="flex items-center gap-2"
            aria-label="Undo last battle"
            title="Undo last battle"
          >
            <Undo2 className="h-4 w-4" />
            <span className="hidden sm:inline">Undo last battle</span>
            <span className="sm:hidden">Undo</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default BattleHeader;
