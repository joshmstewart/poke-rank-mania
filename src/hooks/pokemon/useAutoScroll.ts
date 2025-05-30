
import { useEffect, useRef } from "react";

export const useAutoScroll = (itemCount: number, isRankingArea: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(itemCount);
  const isAtLastCardOnlyRef = useRef(false);
  const autoAdjustModeRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  console.log(`🔍 [AUTO_SCROLL_DEBUG] Hook called - itemCount: ${itemCount}, isRankingArea: ${isRankingArea}`);

  // Check if user is at the "last card only" position (last card visible at top)
  const checkIfAtLastCardOnly = () => {
    if (!containerRef.current || itemCount === 0) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfAtLastCardOnly - early return: container=${!!containerRef.current}, itemCount=${itemCount}`);
      return false;
    }
    
    const container = containerRef.current;
    const cards = container.querySelectorAll('[data-pokemon-id]');
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfAtLastCardOnly - found ${cards.length} cards`);
    
    if (cards.length === 0) return false;
    
    const lastCard = cards[cards.length - 1] as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const lastCardRect = lastCard.getBoundingClientRect();
    
    // Check if the last card is positioned at or near the top of the container
    const cardTopRelativeToContainer = lastCardRect.top - containerRect.top;
    const threshold = 50; // Allow some tolerance
    
    const isAtLastCardOnly = cardTopRelativeToContainer <= threshold && cardTopRelativeToContainer >= -threshold;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfAtLastCardOnly - cardTopRelativeToContainer: ${cardTopRelativeToContainer}, threshold: ${threshold}, result: ${isAtLastCardOnly}`);
    
    return isAtLastCardOnly;
  };

  // Check if user is scrolled to the very bottom
  const checkIfScrolledToBottom = () => {
    if (!containerRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfScrolledToBottom - no container`);
      return false;
    }
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 10; // 10px threshold for "close enough" to bottom
    
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfScrolledToBottom - scrollTop: ${scrollTop}, clientHeight: ${clientHeight}, scrollHeight: ${scrollHeight}, isAtBottom: ${isAtBottom}`);
    
    return isAtBottom;
  };

  // Scroll to position where only the last card is visible at the top
  const scrollToLastCardOnly = () => {
    console.log(`🔍 [AUTO_SCROLL_DEBUG] scrollToLastCardOnly called`);
    
    if (!containerRef.current || itemCount === 0) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] scrollToLastCardOnly - early return`);
      return;
    }
    
    const container = containerRef.current;
    const cards = container.querySelectorAll('[data-pokemon-id]');
    
    if (cards.length === 0) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] scrollToLastCardOnly - no cards found`);
      return;
    }
    
    const lastCard = cards[cards.length - 1] as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const lastCardRect = lastCard.getBoundingClientRect();
    
    // Calculate the scroll position to put the last card at the top
    const currentScrollTop = container.scrollTop;
    const cardTopRelativeToContainer = lastCardRect.top - containerRect.top;
    const targetScrollTop = currentScrollTop + cardTopRelativeToContainer;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] scrollToLastCardOnly - currentScrollTop: ${currentScrollTop}, cardTopRelativeToContainer: ${cardTopRelativeToContainer}, targetScrollTop: ${targetScrollTop}`);
    
    container.scrollTop = targetScrollTop;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] scrollToLastCardOnly - scroll applied, new scrollTop: ${container.scrollTop}`);
  };

  // Handle auto-adjustment when new items are added
  useEffect(() => {
    console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - isRankingArea: ${isRankingArea}, itemCount: ${itemCount}, previousCount: ${previousCountRef.current}, autoAdjustMode: ${autoAdjustModeRef.current}`);
    
    if (!isRankingArea || !containerRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - early return`);
      return;
    }

    const hasNewItem = itemCount > previousCountRef.current;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - hasNewItem: ${hasNewItem}`);
    
    if (hasNewItem && autoAdjustModeRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - triggering auto-adjustment in 100ms`);
      // Small delay to ensure DOM is updated with new card
      setTimeout(() => {
        console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - executing auto-adjustment now`);
        scrollToLastCardOnly();
        console.log("🔄 Auto-adjusted to show new last card at top");
      }, 100);
    }

    previousCountRef.current = itemCount;
  }, [itemCount, isRankingArea]);

  // Track scroll position and update states
  useEffect(() => {
    console.log(`🔍 [AUTO_SCROLL_DEBUG] Scroll effect - isRankingArea: ${isRankingArea}`);
    
    if (!isRankingArea || !containerRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] Scroll effect - early return`);
      return;
    }

    const container = containerRef.current;
    
    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
      
      console.log(`🔍 [AUTO_SCROLL_DEBUG] handleScroll - currentScrollTop: ${currentScrollTop}, lastScrollTop: ${lastScrollTopRef.current}, isScrollingUp: ${isScrollingUp}, autoAdjustMode: ${autoAdjustModeRef.current}`);
      
      // If user scrolls up, immediately disable auto-adjust mode
      if (isScrollingUp && autoAdjustModeRef.current) {
        autoAdjustModeRef.current = false;
        console.log("🛑 Auto-adjust mode disabled - user scrolled up");
      }
      
      // Check current position states
      const atBottom = checkIfScrolledToBottom();
      const atLastCardOnly = checkIfAtLastCardOnly();
      
      console.log(`🔍 [AUTO_SCROLL_DEBUG] handleScroll - atBottom: ${atBottom}, atLastCardOnly: ${atLastCardOnly}`);
      
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
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] Scroll listener added`);
    
    // Initial check
    handleScroll();
    
    return () => {
      container.removeEventListener('scroll', throttledScrollHandler);
      clearTimeout(scrollTimeout);
      console.log(`🔍 [AUTO_SCROLL_DEBUG] Scroll listener removed`);
    };
  }, [isRankingArea]);

  return { containerRef };
};
