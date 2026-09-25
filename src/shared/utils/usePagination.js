import { useState, useMemo } from 'react';

/**
 * Hook personalizado para manejar la paginación de datos
 * @param {Array} data - Array de datos a paginar
 * @param {number} initialItemsPerPage - Cantidad inicial de items por página
 * @returns {Object} - Objeto con datos paginados y funciones de control
 */
export function usePagination(data = [], initialItemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calcular totales
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Obtener datos de la página actual
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Cambiar página
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Cambiar items por página
  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Ir a primera página
  const goToFirstPage = () => setCurrentPage(1);

  // Ir a última página
  const goToLastPage = () => setCurrentPage(totalPages);

  // Ir a página siguiente
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Ir a página anterior
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Resetear paginación
  const resetPagination = () => {
    setCurrentPage(1);
    setItemsPerPage(initialItemsPerPage);
  };

  return {
    // Datos paginados
    paginatedData,
    
    // Estado
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    
    // Funciones de control
    setCurrentPage: handlePageChange,
    setItemsPerPage: handleItemsPerPageChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    resetPagination,
    
    // Info de página actual
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startItem: totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
    endItem: Math.min(currentPage * itemsPerPage, totalItems),
  };
}
