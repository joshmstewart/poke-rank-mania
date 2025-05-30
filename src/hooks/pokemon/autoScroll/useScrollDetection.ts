
import { AutoScrollRefs } from "./types";

export const useScrollDetection = (
  containerRef: React.RefObject<HTMLDivElement>,
  itemCount: number,
  isRankingArea: boolean
) => {
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
    
    // Much more generous threshold - if we can see the last card near the top, consider it "last card only"
    const cardHeight = lastCardRect.height;
    const threshold = cardHeight * 1.5; // Allow 1.5x card height from top
    
    const isAtLastCardOnly = cardTopRelativeToContainer <= threshold && cardTopRelativeToContainer >= -100;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfAtLastCardOnly - cardTopRelativeToContainer: ${cardTopRelativeToContainer}, cardHeight: ${cardHeight}, threshold: ${threshold}, result: ${isAtLastCardOnly}`);
    
    return isAtLastCardOnly;
  };

  // Check if user is scrolled to the very bottom - EXTREMELY STRICT for ranking areas
  const checkIfScrolledToBottom = () => {
    if (!containerRef.current) {
      console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfScrolledToBottom - no container`);
      return false;
    }
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // For ranking areas, be EXTREMELY strict - must be at absolute bottom
    // For available Pokemon, be more lenient
    const tolerance = isRankingArea ? 0 : 1;
    const isAtBottom = Math.abs((scrollTop + clientHeight) - scrollHeight) <= tolerance;
    
    console.log(`🔍 [AUTO_SCROLL_DEBUG] checkIfScrolledToBottom - scrollTop: ${scrollTop}, clientHeight: ${clientHeight}, scrollHeight: ${scrollHeight}`);
    console.log(`🔍 [SCROLL_LIMIT_DEBUG] ${isRankingArea ? 'RANKING' : 'AVAILABLE'} area calculation: |${scrollTop + clientHeight} - ${scrollHeight}| = ${Math.abs((scrollTop + clientHeight) - scrollHeight)} <= ${tolerance} = ${isAtBottom}`);
    console.log(`🔍 [SCROLL_LIMIT_DEBUG] Distance from bottom: ${scrollHeight - (scrollTop + clientHeight)}px`);
    console.log(`🔍 [SCROLL_LIMIT_DEBUG] Max possible scroll: ${scrollHeight - clientHeight}px, current scroll: ${scrollTop}px`);
    
    return isAtBottom;
  };

  return {
    checkIfAtLastCardOnly,
    checkIfScrolledToBottom
  };
};
