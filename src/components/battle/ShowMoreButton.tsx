
import React from "react";
import { Button } from "@/components/ui/button";

interface ShowMoreButtonProps {
  displayCount: number;
  totalCount: number;
  onShowMore: () => void;
}

const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  displayCount,
  totalCount,
  onShowMore
}) => {
  if (displayCount >= totalCount) {
    return null;
  }
  
  return (
    <div className="flex justify-center mt-4">
      <Button
        variant="outline"
        onClick={onShowMore}
        className="w-full max-w-xs"
      >
        Show More ({displayCount}/{totalCount})
      </Button>
    </div>
  );
};

export default ShowMoreButton;
