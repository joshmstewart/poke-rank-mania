
import React from "react";

interface PendingBannerProps {
  isPending: boolean;
}

const PendingBanner: React.FC<PendingBannerProps> = ({ isPending }) => {
  if (!isPending) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 text-center font-semibold pointer-events-none shadow-sm z-20">
      <div className="flex items-center justify-center gap-1">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
        <span>Pending</span>
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  );
};

export default PendingBanner;
