
import React from "react";
import { AlertTriangle } from "lucide-react";

interface BattleFooterNoteProps {
  battlesCompleted: number;
}

const BattleFooterNote: React.FC<BattleFooterNoteProps> = ({ battlesCompleted }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
        <p className="text-sm text-gray-600">
          You've completed {battlesCompleted} battles. The more battles you complete, the more accurate your ranking will be!
        </p>
      </div>
    </div>
  );
};

export default BattleFooterNote;
