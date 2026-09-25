import { useState, useEffect, useCallback } from 'react';
import assetMovementService from '../services/assetMovementService';

export const useAssetMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sagaError, setSagaError] = useState(null);

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assetMovementService.getAllMovements();
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar los movimientos');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMovement = async (movementData) => {
    const newMovement = await assetMovementService.createMovement(movementData);
    setMovements(prev => [newMovement, ...prev]);
    return newMovement;
  };

  const updateMovement = (updatedMovement) => {
    setMovements(prev =>
      prev.map(movement => movement.id === updatedMovement.id ? updatedMovement : movement)
    );
  };

  const deleteMovement = async (id, deletedBy) => {
    await assetMovementService.deleteMovement(id, deletedBy);
    setMovements(prev => prev.filter(movement => movement.id !== id));
  };

  const approveMovement = async (id, approvedBy) => {
    const approved = await assetMovementService.approveMovement(id, approvedBy);
    updateMovement(approved);
    return approved;
  };

  const rejectMovement = async (id, approvedBy, rejectionReason) => {
    const rejected = await assetMovementService.rejectMovement(id, approvedBy, rejectionReason);
    updateMovement(rejected);
    return rejected;
  };

  const markInProcess = async (id, executingUser) => {
    const inProcess = await assetMovementService.markInProcess(id, executingUser);
    updateMovement(inProcess);
    return inProcess;
  };

  const completeMovement = async (id) => {
    setSagaError(null);
    try {
      const completed = await assetMovementService.completeMovement(id);
      updateMovement(completed);
      await loadMovements();
      return completed;
    } catch (err) {
      // Si el error trae syncResult, es un fallo de Saga — actualizar lista igual
      if (err.syncResult) {
        setSagaError(err);
        if (err.movement) updateMovement(err.movement);
        await loadMovements();
        return err.movement;
      }
      throw err;
    }
  };

  const cancelMovement = async (id, cancellationReason) => {
    const cancelled = await assetMovementService.cancelMovement(id, cancellationReason);
    updateMovement(cancelled);
    return cancelled;
  };

  const restoreMovement = async (id, restoredBy) => {
    const restored = await assetMovementService.restoreMovement(id, restoredBy);
    setMovements(prev => [restored, ...prev]);
    return restored;
  };

  const getMovementsByStatus = useCallback(async (status) => {
    const data = await assetMovementService.getMovementsByStatus(status);
    return Array.isArray(data) ? data : [];
  }, []);

  const getMovementsByType = useCallback(async (movementType) => {
    const data = await assetMovementService.getMovementsByType(movementType);
    return Array.isArray(data) ? data : [];
  }, []);

  const getMovementsByAsset = useCallback(async (assetId) => {
    const data = await assetMovementService.getMovementsByAsset(assetId);
    return Array.isArray(data) ? data : [];
  }, []);

  const getPendingApprovalMovements = useCallback(async () => {
    const data = await assetMovementService.getPendingApprovalMovements();
    return Array.isArray(data) ? data : [];
  }, []);

  const countMovements = useCallback(async () => {
    return await assetMovementService.countMovements();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return {
    movements,
    loading,
    error,
    sagaError,
    clearSagaError: () => setSagaError(null),
    loadMovements,
    createMovement,
    updateMovement,
    deleteMovement,
    approveMovement,
    rejectMovement,
    markInProcess,
    completeMovement,
    cancelMovement,
    restoreMovement,
    getMovementsByStatus,
    getMovementsByType,
    getMovementsByAsset,
    getPendingApprovalMovements,
    countMovements
  };
};
