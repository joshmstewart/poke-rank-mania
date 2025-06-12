
import React from "react";

const BattleContentLoading: React.FC = () => {
  console.log(`⏳ [LOADING_SIMPLIFIED] Showing simplified loading state`);
  
  return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
        <p className="text-lg font-medium text-gray-700">Loading Battle System</p>
        <p className="text-sm text-gray-500 mt-2">Preparing Pokemon data and initializing battles...</p>
      </div>
    </div>
  );
};

export default BattleContentLoading;
