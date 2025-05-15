
export function usePagination(currentPage: number, totalPages: number) {
  // Calculate page range for pagination
  const getPageRange = () => {
    const range = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // If total pages is small enough, show all pages
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always include first page
      range.push(1);
      
      // Calculate start and end of middle range
      let middleStart = Math.max(2, currentPage - 1);
      let middleEnd = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust to always show 3 pages in middle if possible
      if (middleEnd - middleStart < 2) {
        if (middleStart === 2) {
          middleEnd = Math.min(4, totalPages - 1);
        } else if (middleEnd === totalPages - 1) {
          middleStart = Math.max(2, totalPages - 3);
        }
      }
      
      // Add ellipsis after first page if needed
      if (middleStart > 2) {
        range.push(-1); // Use -1 as a signal for ellipsis
      }
      
      // Add middle pages
      for (let i = middleStart; i <= middleEnd; i++) {
        range.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (middleEnd < totalPages - 1) {
        range.push(-2); // Use -2 as another signal for ellipsis
      }
      
      // Always include last page
      range.push(totalPages);
    }
    
    return range;
  };
  
  return { getPageRange };
}
