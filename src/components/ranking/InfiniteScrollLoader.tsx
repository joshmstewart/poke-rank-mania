
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
  return (
    <div 
      ref={loadingRef}
      className="flex justify-center items-center h-16 mt-4 bg-gray-100 border border-gray-200 rounded-md"
      data-testid="infinite-scroll-loader"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-2"></div>
          <p className="text-sm">Loading more Pokémon...</p>
        </>
      ) : currentPage < totalPages ? (
        <p className="text-sm text-muted-foreground">Scroll down to load more ({currentPage * 20} of {totalPages * 20}+ Pokémon)</p>
      ) : (
        <p className="text-sm text-muted-foreground">All Pokémon loaded ({totalPages * 20}+)</p>
      )}
    </div>
  );
};
