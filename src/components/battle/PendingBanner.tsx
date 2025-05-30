
import React from "react";

interface PendingBannerProps {
  isPending: boolean;
}

const PendingBanner: React.FC<PendingBannerProps> = ({ isPending }) => {
  // Pending banner removed - validation battles now run automatically
  // No visual indicator needed since the system handles this transparently
  return null;
};

export default PendingBanner;
