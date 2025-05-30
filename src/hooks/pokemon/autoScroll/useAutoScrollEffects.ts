
import { useEffect } from "react";
import { AutoScrollRefs } from "./types";
import { useScrollDetection } from "./useScrollDetection";
import { useScrollToLastCard } from "./useScrollToLastCard";

export const useAutoScrollEffects = (
  refs: AutoScrollRefs,
  itemCount: number,
  isRankingArea: boolean
) => {
  const { containerRef, previousCountRef, isAtLastCardOnlyRef, autoAdjustModeRef, lastScrollTopRef } = refs;
  
  const { checkIfAtLastCardOnly, checkIfScrolledToBottom } = useScrollDetection(
    containerRef,
    itemCount,
    isRankingArea
  );
  
  const { scrollToLastCardOnly } = useScrollToLastCard(containerRef, itemCount);

  // Handle auto-adjustment when new items are added
  useEffect(() => {
    console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - isRankingArea: ${isRankingArea}, itemCount: ${itemCount}, previousCount: ${previousCountRef.current}, autoAdjustMode: ${autoAdjustModeRef.current}`);
    
    if (!containerRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - early return`);
      previousCountRef.current = itemCount; // Still update the count
      return;
    }

    const hasNewItem = itemCount > previousCountRef.current;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - hasNewItem: ${hasNewItem}, autoAdjustMode: ${autoAdjustModeRef.current}`);
    
    if (hasNewItem && autoAdjustModeRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - NEW POKEMON ADDED! Triggering auto-adjustment in 100ms`);
      // Small delay to ensure DOM is updated with new card
      setTimeout(() => {
        console.log(`🔍 [AUTO_SCROLL_DEBUG] Items effect - executing auto-adjustment now`);
        scrollToLastCardOnly();
        console.log("🔄 Auto-adjusted to show new last card at top");
      }, 100);
    }

    previousCountRef.current = itemCount;
  }, [itemCount, isRankingArea, scrollToLastCardOnly]);

  // Track scroll position and update states
  useEffect(() => {
    console.log(`🔍 [AUTO_SCROLL_DEBUG] Scroll effect - isRankingArea: ${isRankingArea}`);
    
    if (!containerRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] Scroll effect - early return`);
      return;
    }

    const container = containerRef.current;
    
    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
      
      console.log(`🔍 [AUTO_SCROLL_DEBUG] handleScroll - currentScrollTop: ${currentScrollTop}, lastScrollTop: ${lastScrollTopRef.current}, isScrollingUp: ${isScrollingUp}, autoAdjustMode: ${autoAdjustModeRef.current}`);
      
      // DETAILED SCROLL CONTAINER ANALYSIS
      console.log(`🔍 [SCROLL_ANALYSIS] Container scroll properties:`);
      console.log(`🔍 [SCROLL_ANALYSIS]   scrollTop: ${container.scrollTop}px`);
      console.log(`🔍 [SCROLL_ANALYSIS]   scrollHeight: ${container.scrollHeight}px`);
      console.log(`🔍 [SCROLL_ANALYSIS]   clientHeight: ${container.clientHeight}px`);
      console.log(`🔍 [SCROLL_ANALYSIS]   offsetHeight: ${container.offsetHeight}px`);
      console.log(`🔍 [SCROLL_ANALYSIS]   maxScrollTop: ${container.scrollHeight - container.clientHeight}px`);
      console.log(`🔍 [SCROLL_ANALYSIS]   canScrollMore: ${container.scrollTop < (container.scrollHeight - container.clientHeight)}px`);
      
      // If user scrolls up, immediately disable auto-adjust mode
      if (isScrollingUp && autoAdjustModeRef.current) {
        autoAdjustModeRef.current = false;
        console.log("🛑 Auto-adjust mode disabled - user scrolled up");
      }
      
      // Check current position states
      const atBottom = checkIfScrolledToBottom();
      const atLastCardOnly = checkIfAtLastCardOnly();
      
      console.log(`🔍 [AUTO_SCROLL_DEBUG] handleScroll - atBottom: ${atBottom}, atLastCardOnly: ${atLastCardOnly}`);
      
      // Enable auto-adjust mode ONLY when user reaches the VERY bottom or last-card-only position
      if ((atBottom || atLastCardOnly) && !autoAdjustModeRef.current) {
        autoAdjustModeRef.current = true;
        console.log("🚀 Auto-adjust mode enabled - at absolute bottom or last card only");
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
  }, [isRankingArea, checkIfAtLastCardOnly, checkIfScrolledToBottom]);
};
