import { useState, useEffect } from 'react';
import HandoverReceiptList from '../components/HandoverReceipt/HandoverReceiptList';
import HandoverReceiptForm from '../components/HandoverReceipt/HandoverReceiptForm';
import HandoverReceiptDetails from '../components/HandoverReceipt/HandoverReceiptDetails';
import HandoverReceiptSignature from '../components/HandoverReceipt/HandoverReceiptSignature';
import { useHandoverReceipts } from '../hooks/useHandoverReceipts';
import handoverUserService from '../services/handoverUserService';
import assetMovementService from '../services/assetMovementService';
import handoverReceiptService from '../services/handoverReceiptService';
import ContentLoading from '../../../shared/utils/ContentLoading';
import { usePermissions } from '../../../hooks/usePermissions';
import { enrichReceiptAssets, receiptAssetsNeedEnrichment } from '../utils/handoverReceiptAssetResolver';
import { normalizeApiList } from '../utils/movementReportHelpers';
import { getEnv } from '../../../shared/utils/env.js';

export default function ActasPage() {
  const municipalityId = (() => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.municipal_code || payload.municipalCode || payload.municipality_id || null;
      }
    } catch { /* skip */ }
    return null;
  })();
  const { canDo } = usePermissions();
  const {
    receipts,
    loading,
    error,
    loadReceipts,
    createReceipt,
    updateReceiptData,
    signReceipt
  } = useHandoverReceipts(municipalityId);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [users, setUsers] = useState([]);
  const [persons, setPersons] = useState([]);
  const [availableMovements, setAvailableMovements] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPersons, setLoadingPersons] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [displayReceipts, setDisplayReceipts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUsers(true);
        setLoadingPersons(true);
        setLoadingMovements(true);
        setLoadingAssets(true);

        const personService = await import('../../ms-02-authentication/services/personService');

        const token = sessionStorage.getItem('accessToken');
        const API_BASE = getEnv('VITE_GATEWAY_API_URL', '/api/v1');
        const assetsUrl = `${API_BASE}/assets${municipalityId ? `?municipalityId=${municipalityId}` : ''}`;
        const assetHeaders = { 'Content-Type': 'application/json' };
        if (token) assetHeaders.Authorization = `Bearer ${token}`;

        const [userData, personsData, movementsData, assetsData] = await Promise.allSettled([
          handoverUserService.getUsersByMunicipality(municipalityId),
          personService.default.getAllPersons(),
          assetMovementService.getAllMovements(),
          fetch(assetsUrl, { method: 'GET', headers: assetHeaders }).then(async (response) => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            return response.json();
          }),
        ]);

        setUsers(userData.status === 'fulfilled' ? userData.value : []);

        let personsArray = personsData.status === 'fulfilled' ? personsData.value : [];
        if (Array.isArray(personsArray) && personsArray.length > 0 && municipalityId) {
          const byMunicipality = personsArray.filter(p => {
            const pid = p.municipalityId || p.municipalCode || p.municipality;
            return !pid || pid === municipalityId;
          });
          if (byMunicipality.length > 0) personsArray = byMunicipality;
        }
        setPersons(personsArray);

        setAvailableMovements(movementsData.status === 'fulfilled' ? movementsData.value : []);
        const assetsArray = assetsData.status === 'fulfilled'
          ? normalizeApiList(assetsData.value)
          : [];
        setAvailableAssets(assetsArray);
      } catch (error) {
        // Error handled
      } finally {
        setLoadingUsers(false);
        setLoadingPersons(false);
        setLoadingMovements(false);
        setLoadingAssets(false);
      }
    };
    loadData();
  }, [municipalityId]);

  useEffect(() => {
    if (!receipts.length) {
      setDisplayReceipts([]);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const enrichedList = await Promise.all(
        receipts.map((receipt) => {
          const movement = availableMovements.find(
            (item) => String(item.id) === String(receipt.movementId)
          );
          return enrichReceiptAssets(receipt, availableAssets, {
            movement,
            movements: availableMovements,
          });
        })
      );
      if (cancelled) return;
      setDisplayReceipts(enrichedList);

      enrichedList.forEach((enriched, index) => {
        const original = receipts[index];
        if (
          receiptAssetsNeedEnrichment(original?.assets || [])
          && !receiptAssetsNeedEnrichment(enriched?.assets || [])
        ) {
          handoverReceiptService.updateHandoverReceipt(enriched.id, {
            movementId: enriched.movementId,
            assets: enriched.assets,
          }).catch(() => {});
        }
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [receipts, availableAssets]);

  const handleCreateNew = async () => {
    setSelectedReceipt(null);
    try {
      setLoadingMovements(true);
      const movementsData = await assetMovementService.getAllMovements();
      setAvailableMovements(movementsData);
      setLoadingMovements(false);
    } catch (error) {
      setLoadingMovements(false);
    }
    setShowForm(true);
  };

  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setShowForm(true);
  };

  const handleView = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDetails(true);
  };

  const handleSign = (receipt) => {
    setSelectedReceipt(receipt);
    setShowSignature(true);
  };

  const handleFormSave = async (receiptData) => {
    try {
      if (selectedReceipt) {
        await updateReceiptData(selectedReceipt.id, receiptData);
      } else {
        await createReceipt(receiptData);
      }
      setShowForm(false);
      setSelectedReceipt(null);
      await loadReceipts();
    } catch (error) {
      // Error handled
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedReceipt(null);
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedReceipt(null);
  };

  const handleSignatureComplete = async (signatureData) => {
    try {
      await signReceipt(selectedReceipt.id, signatureData);
    } catch (error) {
      // Error handled
    } finally {
      setShowSignature(false);
      setSelectedReceipt(null);
      await loadReceipts();
    }
  };

  const handleSignatureCancel = () => {
    setShowSignature(false);
    setSelectedReceipt(null);
  };

  const handleVoid = async (receipt) => {
    const { default: Swal } = await import('sweetalert2');
    const result = await Swal.fire({
      title: '¿Marcar como No Vigente?',
      text: 'Esta acta quedará anulada y no podrá revertirse.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await handoverReceiptService.voidHandoverReceipt(receipt.id);
      await loadReceipts();
      Swal.fire({ title: 'Anulada', text: 'El acta fue marcada como No Vigente.', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'No se pudo anular el acta. Verifica que el endpoint esté disponible.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[400px]">
        <ContentLoading isLoading={true} message="Cargando actas de entrega..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header */}
      <div className="bg-blue-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Actas de Entrega-Recepción
                </h1>
                <p className="text-blue-100 text-sm font-medium">
                  Gestión de actas de entrega-recepción de bienes patrimoniales
                </p>
              </div>
            </div>
            {canDo('movimientos', 'receipt', 'generate') && (
              <button
                onClick={handleCreateNew}
                disabled={loadingMovements || loadingUsers}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  loadingMovements || loadingUsers
                    ? 'bg-white/30 text-white/70 cursor-not-allowed'
                    : 'bg-transparent border-2 border-white/70 hover:bg-white/20 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {loadingMovements || loadingUsers ? 'Cargando...' : 'Nueva Acta'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {receipts.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Actas</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-blue-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Generadas</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.filter(r => r.receiptStatus === 'GENERATED').length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.filter(r => r.receiptStatus === 'PARTIALLY_SIGNED').length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Firmadas</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.filter(r => r.receiptStatus === 'FULLY_SIGNED').length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">No Vigentes</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.filter(r => r.receiptStatus === 'VOIDED').length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
          <button onClick={loadReceipts} className="mt-2 text-sm underline hover:text-red-900">
            Intentar nuevamente
          </button>
        </div>
      )}

      {/* Lista */}
      <HandoverReceiptList
        receipts={displayReceipts.length ? displayReceipts : receipts}
        users={users}
        persons={persons}
        movements={availableMovements}
        assets={availableAssets}
        loading={false}
        error={null}
        onView={handleView}
        onEdit={handleEdit}
        onSign={handleSign}
        onVoid={handleVoid}
        onRetry={loadReceipts}
      />

      {/* Formulario */}
      {showForm && (
        <HandoverReceiptForm
          municipalityId={municipalityId}
          receipt={selectedReceipt}
          movements={availableMovements}
          users={users}
          persons={persons}
          assets={availableAssets}
          loadingMovements={loadingMovements}
          loadingUsers={loadingUsers}
          loadingAssets={loadingAssets}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Detalles */}
      {showDetails && selectedReceipt && (
        <HandoverReceiptDetails
          receiptId={selectedReceipt.id}
          municipalityId={municipalityId}
          users={users}
          persons={persons}
          movements={availableMovements}
          assets={availableAssets}
          onClose={handleDetailsClose}
          onEdit={handleEdit}
          onSign={handleSign}
        />
      )}

      {/* Firma */}
      {showSignature && selectedReceipt && (
        <HandoverReceiptSignature
          receipt={selectedReceipt}
          municipalityId={municipalityId}
          onSigned={handleSignatureComplete}
          onCancel={handleSignatureCancel}
        />
      )}
    </div>
  );
}
