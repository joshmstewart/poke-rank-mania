
import React, { useRef, useEffect } from "react";

interface InfiniteScrollHandlerProps {
  hasMoreToLoad: boolean;
  currentCount: number;
  maxItems: number;
  onLoadMore: () => void;
}

const InfiniteScrollHandler: React.FC<InfiniteScrollHandlerProps> = ({
  hasMoreToLoad,
  currentCount,
  maxItems,
  onLoadMore
}) => {
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Clean up previous observer
    if (observerRef.current && loadingRef.current) {
      observerRef.current.unobserve(loadingRef.current);
      observerRef.current = null;
    }

    // Only set up observer if we haven't loaded all items yet
    if (hasMoreToLoad) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          console.log(`Loading more items: ${currentCount} -> ${Math.min(currentCount + 50, maxItems)}`);
          onLoadMore();
        }
      }, { 
        rootMargin: '200px',
        threshold: 0.1 
      });
      
      if (loadingRef.current) {
        observerRef.current.observe(loadingRef.current);
      }
    }

    return () => {
      if (observerRef.current && loadingRef.current) {
        observerRef.current.unobserve(loadingRef.current);
      }
    };
  }, [hasMoreToLoad, currentCount, maxItems, onLoadMore]);

  if (!hasMoreToLoad) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">
          All {currentCount} Pokémon loaded
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={loadingRef}
      className="text-center py-4"
    >
      <div className="text-sm text-gray-500">
        Loading more Pokémon... ({currentCount}/{maxItems})
      </div>
    </div>
  );
};

export default InfiniteScrollHandler;
