
import React from "react";
import { Button } from "@/components/ui/button";

interface ShowMoreButtonProps {
  displayCount: number;
  totalCount: number;
  onShowMore: () => void;
  currentCount?: number; // Add this optional prop to match usage
}

const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  displayCount,
  totalCount,
  onShowMore,
  currentCount
}) => {
  // Use currentCount if provided, otherwise fall back to displayCount
  const count = currentCount !== undefined ? currentCount : displayCount;
  
  if (count >= totalCount) {
    return null;
  }
  
  return (
    <div className="flex justify-center mt-4">
      <Button
        variant="outline"
        onClick={onShowMore}
        className="w-full max-w-xs"
      >
        Show More ({count}/{totalCount})
      </Button>
    </div>
  );
};

export default ShowMoreButton;
