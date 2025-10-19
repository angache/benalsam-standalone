import { useState, useMemo, useCallback } from 'react';

export const usePagination = (items = [], itemsPerPage = 12, totalItems = null) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Toplam sayfa sayısını hesapla
  const totalPages = useMemo(() => {
    const total = totalItems !== null ? totalItems : items.length;
    return Math.ceil(total / itemsPerPage);
  }, [items.length, itemsPerPage, totalItems]);

  // Mevcut sayfadaki itemları getir
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  // Sayfa değiştir
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  // Sonraki sayfa
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  // Önceki sayfa
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // İlk sayfa
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Son sayfa
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Sayfa numaralarını hesapla (görüntülenecek sayfalar)
  const getPageNumbers = useCallback(() => {
    const delta = 2; // Her iki taraftan kaç sayfa gösterilecek
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    currentItems,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    getPageNumbers,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    totalItems: totalItems !== null ? totalItems : items.length,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems !== null ? totalItems : items.length)
  };
};
