import { useState, useEffect, useMemo } from 'react';

export function usePagination<T>(items: T[], defaultItemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Réinitialiser la page courante si le nombre total d'éléments change
  useEffect(() => {
    if (currentPage > Math.ceil(items.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [items.length, itemsPerPage, currentPage]);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const validPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(validPage);
  };

  const changeItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    currentItems,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    changeItemsPerPage
  };
}