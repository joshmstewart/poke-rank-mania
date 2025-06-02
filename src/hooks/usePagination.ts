
import { useMemo } from "react";
import { LoadingType } from "@/hooks/pokemon/types";

export const usePagination = (
  items: any[],
  currentPage: number,
  pageSize: number,
  loadingType: LoadingType
) => {
  const paginatedItems = useMemo(() => {
    console.log(`🔍 [PAGINATION] Input items: ${items.length}, page: ${currentPage}, size: ${pageSize}, type: ${loadingType}`);
    
    if (loadingType === "pagination") {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const result = items.slice(startIndex, endIndex);
      console.log(`🔍 [PAGINATION] Pagination mode: returning ${result.length} items (${startIndex}-${endIndex})`);
      return result;
    }
    
    // For infinite scroll, single load, or any other mode, return all items
    console.log(`🔍 [PAGINATION] Non-pagination mode (${loadingType}): returning all ${items.length} items`);
    return items;
  }, [items, currentPage, pageSize, loadingType]);

  const totalPages = useMemo(() => {
    if (loadingType === "pagination") {
      const pages = Math.ceil(items.length / pageSize);
      console.log(`🔍 [PAGINATION] Calculated total pages: ${pages} (${items.length} items / ${pageSize} per page)`);
      return pages;
    }
    console.log(`🔍 [PAGINATION] Non-pagination mode: returning 1 page for ${items.length} items`);
    return 1;
  }, [items.length, pageSize, loadingType]);

  return {
    paginatedItems,
    totalPages
  };
};
