
import React from "react";

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  loadingRef: React.RefObject<HTMLDivElement>;
}

export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({
  isLoading,
  currentPage,
  totalPages,
  loadingRef
}) => {
  // Calculate more accurate counts based on pages and items per page
  const itemsPerPage = 50; // Using the constant from Pokemon service
  const currentlyLoaded = currentPage * itemsPerPage;
  const totalEstimated = totalPages * itemsPerPage;
  
  return (
    <div 
      ref={loadingRef}
      className="flex justify-center items-center h-16 mt-4 bg-gray-100 border border-gray-200 rounded-md"
      data-testid="infinite-scroll-loader"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-2"></div>
          <p className="text-sm">Loading page {currentPage} of {totalPages}...</p>
        </>
      ) : currentPage < totalPages ? (
        <p className="text-sm text-muted-foreground">
          Scroll down to load more (Loaded {currentlyLoaded-itemsPerPage}-{currentlyLoaded} of approximately {totalEstimated}+ Pokémon)
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">All Pokémon loaded (Approximately {totalEstimated}+)</p>
      )}
    </div>
  );
};
