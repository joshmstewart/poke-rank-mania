
import React from "react";

interface BattleFooterNoteProps {
  battlesCompleted: number;
}

const BattleFooterNote: React.FC<BattleFooterNoteProps> = ({ battlesCompleted }) => {
  return (
    <div className="text-center text-xs text-muted-foreground p-2 opacity-70 mt-4">
      <p>
        {battlesCompleted} battles completed
        {battlesCompleted < 10 ? 
          " · More battles = more accurate rankings" : 
          battlesCompleted > 50 ? 
          " · Your rankings are becoming statistically significant" :
          " · Your ranking is improving with each battle"}
      </p>
    </div>
  );
};

export default BattleFooterNote;
