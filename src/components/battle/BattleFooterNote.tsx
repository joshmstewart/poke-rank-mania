
import React from "react";
import { Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BattleFooterNoteProps {
  battlesCompleted: number;
}

const BattleFooterNote: React.FC<BattleFooterNoteProps> = ({ battlesCompleted }) => {
  return (
    <div className="text-center text-sm text-muted-foreground p-2">
      <p>
        You've completed <span className="font-medium">{battlesCompleted}</span> battles
        {battlesCompleted < 10 ? 
          ". The more battles you complete, the more accurate your ranking will be." : 
          ". Your ranking is getting more accurate with each battle."}
      </p>
      {battlesCompleted > 50 && (
        <p className="text-xs text-muted-foreground mt-1 opacity-75">
          With {battlesCompleted} battles, your rankings are becoming statistically significant.
        </p>
      )}
    </div>
  );
};

export default BattleFooterNote;
