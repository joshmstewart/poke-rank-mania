
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
  if (totalCount <= displayCount) {
    return null;
  }
  
  return (
    <div className="mt-4 text-center">
      <Button 
        variant="outline" 
        onClick={onShowMore}
        className="px-8"
      >
        Show More ({displayCount}/{totalCount})
      </Button>
    </div>
  );
};

export default ShowMoreButton;
