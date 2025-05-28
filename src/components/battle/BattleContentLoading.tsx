
import React from "react";

const BattleContentLoading: React.FC = () => {
  console.log(`⏳ [FINAL_FIX] Showing loading state - no battle data available`);
  
  return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
        <p className="text-sm text-gray-600">Initializing battles...</p>
      </div>
    </div>
  );
};

export default BattleContentLoading;
