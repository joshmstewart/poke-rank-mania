
import { useRef, useEffect } from "react";

export function useScrollObserver(
  loadingType: string,
  isLoading: boolean,
  currentPage: number,
  totalPages: number,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  
  // Setup infinite scroll observer
  useEffect(() => {
    // Only set up observer when using infinite loading
    if (loadingType === "infinite") {
      // Cleanup previous observer first
      if (observerRef.current && loadingRef.current) {
        observerRef.current.unobserve(loadingRef.current);
        observerRef.current = null;
      }
      
      // Create new observer
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && currentPage < totalPages) {
          // When the loading element is visible and we're not already loading, increment the page
          console.log(`Loading next page: ${currentPage + 1} of ${totalPages}`);
          setCurrentPage(prevPage => prevPage + 1);
        }
      }, { 
        rootMargin: '200px', // Start loading even earlier before element is visible
        threshold: 0.1 // Trigger when 10% of element is visible
      });
      
      // Start observing the loading element
      if (loadingRef.current) {
        observerRef.current.observe(loadingRef.current);
      }
      
      return () => {
        if (observerRef.current && loadingRef.current) {
          observerRef.current.unobserve(loadingRef.current);
        }
      };
    }
  }, [loadingType, isLoading, currentPage, totalPages, setCurrentPage]);
  
  return { loadingRef };
}
