import { useState, useEffect, useCallback } from 'react';
import handoverReceiptService from '../services/handoverReceiptService';
export const useHandoverReceipts = (municipalityId) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await handoverReceiptService.getAllHandoverReceipts();
      
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar las actas de entrega-recepción');
      console.error('Error loading receipts:', err);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, []);
  const createReceipt = async (receiptData) => {
    try {
      const newReceipt = await handoverReceiptService.createHandoverReceipt(receiptData);
      return newReceipt;
    } catch (err) {
      console.error('Error creating receipt:', err);
      throw err;
    }
  };
  const updateReceiptData = async (id, receiptData) => {
    try {
      const updatedReceipt = await handoverReceiptService.updateHandoverReceipt(id, receiptData);
      return updatedReceipt;
    } catch (err) {
      console.error('Error updating receipt:', err);
      throw err;
    }
  };
  const updateReceipt = (updatedReceipt) => {
    setReceipts(prev => 
      prev.map(receipt => 
        receipt.id === updatedReceipt.id ? updatedReceipt : receipt
      )
    );
  };
  const signReceipt = async (receiptId, signatureData) => {
    try {
      const signedReceipt = await handoverReceiptService.signHandoverReceipt(
        receiptId, 
        signatureData
      );
      updateReceipt(signedReceipt);
      return signedReceipt;
    } catch (err) {
      console.error('Error signing receipt:', err);
      throw err;
    }
  };
  const getReceiptsByStatus = useCallback(async (status) => {
    try {
      const data = await handoverReceiptService.getHandoverReceiptsByStatus(status);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading receipts by status:', err);
      throw err;
    }
  }, []);
  const getReceiptsByResponsible = useCallback(async (responsibleId) => {
    try {
      const data = await handoverReceiptService.getHandoverReceiptsByResponsible(responsibleId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading receipts by responsible:', err);
      throw err;
    }
  }, []);
  const getReceiptByMovement = useCallback(async (movementId) => {
    try {
      return await handoverReceiptService.getHandoverReceiptByMovement(movementId);
    } catch (err) {
      console.error('Error loading receipt by movement:', err);
      throw err;
    }
  }, []);
  const countReceipts = useCallback(async () => {
    try {
      return await handoverReceiptService.countHandoverReceipts();
    } catch (err) {
      console.error('Error counting receipts:', err);
      return 0;
    }
  }, []);
  const countReceiptsByStatus = useCallback(async (status) => {
    try {
      return await handoverReceiptService.countHandoverReceiptsByStatus(status);
    } catch (err) {
      console.error('Error counting receipts by status:', err);
      return 0;
    }
  }, []);
  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);
  return {
    receipts,
    loading,
    error,
    loadReceipts,
    createReceipt,
    updateReceipt,
    updateReceiptData,
    signReceipt,
    getReceiptsByStatus,
    getReceiptsByResponsible,
    getReceiptByMovement,
    countReceipts,
    countReceiptsByStatus
  };
};

