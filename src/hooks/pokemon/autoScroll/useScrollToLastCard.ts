
export const useScrollToLastCard = (
  containerRef: React.RefObject<HTMLDivElement>,
  itemCount: number
) => {
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

  return {
    scrollToLastCardOnly
  };
};
