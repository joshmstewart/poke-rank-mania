
import React from "react";
import { generations } from "@/services/pokemon";

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
  
  // Always render the ref element, even when loading is complete
  return (
    <div 
      ref={loadingRef}
      className="flex justify-center items-center h-16 mt-4 bg-gray-100 border border-gray-200 rounded-md"
      data-testid="infinite-scroll-loader"
      style={{ minHeight: '64px' }} // Ensure the element has height for intersection
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-2"></div>
          <p className="text-sm">Loading page {currentPage + 1} of {totalPages}...</p>
        </>
      ) : currentPage < totalPages ? (
        <p className="text-sm text-muted-foreground">
          <span>Scroll down for more Pokémon</span>
          <span className="ml-1 text-xs">(Loaded {currentlyLoaded} of approximately {totalEstimated}+ Pokémon)</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">All Pokémon loaded (Approximately {totalEstimated}+)</p>
      )}
    </div>
  );
};
