
import { useEffect, useRef } from "react";

export const useAutoScroll = (itemCount: number, isRankingArea: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(itemCount);
  const isScrolledToBottomRef = useRef(false);

  // Check if user is scrolled to bottom
  const checkIfScrolledToBottom = () => {
    if (!containerRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 10; // 10px threshold for "close enough" to bottom
    
    return scrollTop + clientHeight >= scrollHeight - threshold;
  };

  // Auto-scroll to bottom when new item is added and user was at bottom
  useEffect(() => {
    if (!isRankingArea || !containerRef.current) return;

    const hasNewItem = itemCount > previousCountRef.current;
    
    if (hasNewItem) {
      // If user was at bottom or this is the first item, scroll to show new item
      if (isScrolledToBottomRef.current || itemCount === 1) {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 100); // Small delay to ensure DOM is updated
      }
    }

    previousCountRef.current = itemCount;
  }, [itemCount, isRankingArea]);

  // Track scroll position
  useEffect(() => {
    if (!isRankingArea || !containerRef.current) return;

    const container = containerRef.current;
    
    const handleScroll = () => {
      isScrolledToBottomRef.current = checkIfScrolledToBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isRankingArea]);

  return { containerRef };
};
