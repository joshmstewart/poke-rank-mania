
import { useMemo } from "react";
import { LoadingType } from "@/hooks/pokemon/types";

export const usePagination = (
  items: any[], 
  currentPage: number, 
  loadSize: number, 
  loadingType: LoadingType
) => {
  const paginatedItems = useMemo(() => {
    if (loadingType === "infinite") {
      // For infinite loading, return all items up to current page
      return items.slice(0, currentPage * loadSize);
    }
    
    if (loadingType === "search") {
      // For search, return all items
      return items;
    }
    
    // For pagination, return items for current page only
    const startIndex = (currentPage - 1) * loadSize;
    const endIndex = startIndex + loadSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, loadSize, loadingType]);

  const totalPages = useMemo(() => {
    if (loadingType === "infinite" || loadingType === "search") {
      return 1;
    }
    return Math.ceil(items.length / loadSize);
  }, [items.length, loadSize, loadingType]);

  return {
    paginatedItems,
    totalPages
  };
};
