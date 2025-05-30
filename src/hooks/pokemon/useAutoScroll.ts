
import { useEffect, useRef } from "react";

export const useAutoScroll = (itemCount: number, isRankingArea: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(itemCount);
  const isAtLastCardOnlyRef = useRef(false);
  const autoAdjustModeRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // Check if user is at the "last card only" position (last card visible at top)
  const checkIfAtLastCardOnly = () => {
    if (!containerRef.current || itemCount === 0) return false;
    
    const container = containerRef.current;
    const cards = container.querySelectorAll('[data-pokemon-id]');
    
    if (cards.length === 0) return false;
    
    const lastCard = cards[cards.length - 1] as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const lastCardRect = lastCard.getBoundingClientRect();
    
    // Check if the last card is positioned at or near the top of the container
    const cardTopRelativeToContainer = lastCardRect.top - containerRect.top;
    const threshold = 50; // Allow some tolerance
    
    return cardTopRelativeToContainer <= threshold && cardTopRelativeToContainer >= -threshold;
  };

  // Check if user is scrolled to the very bottom
  const checkIfScrolledToBottom = () => {
    if (!containerRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 10; // 10px threshold for "close enough" to bottom
    
    return scrollTop + clientHeight >= scrollHeight - threshold;
  };

  // Scroll to position where only the last card is visible at the top
  const scrollToLastCardOnly = () => {
    if (!containerRef.current || itemCount === 0) return;
    
    const container = containerRef.current;
    const cards = container.querySelectorAll('[data-pokemon-id]');
    
    if (cards.length === 0) return;
    
    const lastCard = cards[cards.length - 1] as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const lastCardRect = lastCard.getBoundingClientRect();
    
    // Calculate the scroll position to put the last card at the top
    const currentScrollTop = container.scrollTop;
    const cardTopRelativeToContainer = lastCardRect.top - containerRect.top;
    const targetScrollTop = currentScrollTop + cardTopRelativeToContainer;
    
    container.scrollTop = targetScrollTop;
  };

  // Handle auto-adjustment when new items are added
  useEffect(() => {
    if (!isRankingArea || !containerRef.current) return;

    const hasNewItem = itemCount > previousCountRef.current;
    
    if (hasNewItem && autoAdjustModeRef.current) {
      // Small delay to ensure DOM is updated with new card
      setTimeout(() => {
        scrollToLastCardOnly();
        console.log("🔄 Auto-adjusted to show new last card at top");
      }, 100);
    }

    previousCountRef.current = itemCount;
  }, [itemCount, isRankingArea]);

  // Track scroll position and update states
  useEffect(() => {
    if (!isRankingArea || !containerRef.current) return;

    const container = containerRef.current;
    
    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
      
      // If user scrolls up, immediately disable auto-adjust mode
      if (isScrollingUp && autoAdjustModeRef.current) {
        autoAdjustModeRef.current = false;
        console.log("🛑 Auto-adjust mode disabled - user scrolled up");
      }
      
      // Check current position states
      const atBottom = checkIfScrolledToBottom();
      const atLastCardOnly = checkIfAtLastCardOnly();
      
      // Enable auto-adjust mode when user reaches bottom or last-card-only position
      if ((atBottom || atLastCardOnly) && !autoAdjustModeRef.current) {
        autoAdjustModeRef.current = true;
        console.log("🚀 Auto-adjust mode enabled - at bottom or last card only");
      }
      
      // Update refs
      isAtLastCardOnlyRef.current = atLastCardOnly;
      lastScrollTopRef.current = currentScrollTop;
    };

    // Add scroll listener with throttling
    let scrollTimeout: NodeJS.Timeout;
    const throttledScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
    };

    container.addEventListener('scroll', throttledScrollHandler);
    
    // Initial check
    handleScroll();
    
    return () => {
      container.removeEventListener('scroll', throttledScrollHandler);
      clearTimeout(scrollTimeout);
    };
  }, [isRankingArea]);

  return { containerRef };
};
