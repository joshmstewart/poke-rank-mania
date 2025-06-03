
import React from "react";

interface GlobalRankingsViewProps {
  selectedGeneration: number;
}

const GlobalRankingsView: React.FC<GlobalRankingsViewProps> = ({
  selectedGeneration
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Global Rankings Coming Soon
        </h3>
        <p className="text-gray-500">
          This will show aggregated rankings from all users for Generation {selectedGeneration === 0 ? "All" : selectedGeneration}.
        </p>
      </div>
    </div>
  );
};

export default GlobalRankingsView;
