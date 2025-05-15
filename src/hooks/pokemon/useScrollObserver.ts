
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
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && currentPage < totalPages) {
          // When the loading element is visible, load more Pokemon
          console.log("Loading more Pokémon: page", currentPage + 1);
          setCurrentPage(prevPage => prevPage + 1);
        }
      }, { threshold: 0.1 }); // Lower threshold for earlier triggering
      
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
