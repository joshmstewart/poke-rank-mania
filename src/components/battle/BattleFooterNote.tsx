
import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BattleFooterNoteProps {
  battlesCompleted: number;
}

const BattleFooterNote: React.FC<BattleFooterNoteProps> = ({ battlesCompleted }) => {
  // Determine which icon and color to use based on battles completed
  const showWarning = battlesCompleted < 10;
  
  return (
    <div className={`rounded-lg shadow p-4 ${showWarning ? 'bg-amber-50' : 'bg-blue-50'}`}>
      <div className="flex items-start">
        {showWarning ? (
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
        )}
        <ScrollArea className="h-full max-h-24">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              You've completed <span className="font-bold">{battlesCompleted}</span> battles.
              {showWarning ? (
                " The more battles you complete, the more accurate your ranking will be!"
              ) : (
                " Your ranking is getting more accurate with each battle. Keep going!"
              )}
            </p>
            {battlesCompleted > 50 && (
              <p className="text-xs text-gray-500">
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
