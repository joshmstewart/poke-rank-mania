
import React from "react";
import { Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BattleFooterNoteProps {
  battlesCompleted: number;
}

const BattleFooterNote: React.FC<BattleFooterNoteProps> = ({ battlesCompleted }) => {
  return (
    <div className="rounded-lg border border-muted p-4 bg-background">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
        <ScrollArea className="h-full max-h-24">
          <div>
            <p className="text-sm text-muted-foreground">
              You've completed <span className="font-medium">{battlesCompleted}</span> battles.
              {battlesCompleted < 10 ? (
                " The more battles you complete, the more accurate your ranking will be."
              ) : (
                " Your ranking is getting more accurate with each battle."
              )}
            </p>
            {battlesCompleted > 50 && (
              <p className="text-xs text-muted-foreground mt-1 opacity-75">
                With {battlesCompleted} battles, your rankings are becoming statistically significant.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default BattleFooterNote;
