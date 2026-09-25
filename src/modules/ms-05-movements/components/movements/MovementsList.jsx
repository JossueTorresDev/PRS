import { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  CubeIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import assetMovementService from '../../services/assetMovementService';
import { MovementStatusConfig, formatDateOnly, MovementTypeLabels } from '../../types/movementTypes';
import Paginator from '../../../../shared/utils/Paginator';
import { usePagination } from '../../../../shared/utils/usePagination';
import { getBienPatrimonialById } from '../../../ms-04-patrimonio/services/api';
import { cleanAssetName } from '../../utils/assetNameFormatter';
import { resolveMovementAssetItems } from '../../utils/movementReportHelpers';
import { BlobProvider, pdf } from '@react-pdf/renderer';
import MovementDetailReport from '../../reports/MovementDetailReport';
import { openPdfInBrowser } from '../../utils/openPdfReport';

function PdfReportButton({ movement, persons, users, areas, locations, assetSearchData, municipalityLogo, municipalityName }) {
  const [generating, setGenerating] = useState(false);
  const handleClick = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      let record = movement;
      try {
        const full = await assetMovementService.getMovementById(movement.id);
        if (full) record = { ...movement, ...full };
      } catch {
        /* usar fila del listado */
      }

      const assetNamesById = {};
      resolveMovementAssetItems(record).forEach((item) => {
        const cached = assetSearchData?.[item.assetId];
        if (cached) {
          assetNamesById[item.assetId] = cleanAssetName(
            cached.description || cached.descripcion || cached.assetCode || cached.code || item.assetId
          ) || item.assetId;
        }
      });

      await Promise.all(
        resolveMovementAssetItems(record)
          .filter((item) => !assetNamesById[item.assetId])
          .map(async (item) => {
            try {
              const asset = await getBienPatrimonialById(item.assetId);
              if (asset) {
                assetNamesById[item.assetId] = cleanAssetName(
                  asset.description || asset.descripcion || asset.assetCode || item.assetId
                ) || item.assetId;
              }
            } catch {
              assetNamesById[item.assetId] = item.assetId;
            }
          })
      );

      const assetName = assetNamesById[record.assetId]
        || Object.values(assetNamesById)[0]
        || record.assetId;

      const blob = await pdf(
        <MovementDetailReport
          movement={record}
          assetName={assetName}
          assetNamesById={assetNamesById}
          persons={persons}
          users={users}
          areas={areas}
          locations={locations}
          municipalityLogo={municipalityLogo}
          municipalityName={municipalityName}
        />
      ).toBlob();

      const title = `Movimiento ${movement.movementNumber || ''}`.trim();
      openPdfInBrowser(blob, title);
    } catch {
      /* sin blob */
    } finally {
      setGenerating(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={generating}
      title="Ver reporte PDF"
      className="p-2.5 text-amber-500 hover:text-white hover:bg-amber-500 rounded-lg transition-all duration-200 border border-amber-400 hover:border-amber-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {generating ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
    </button>
  );
}

function MovementAssetsCell({ items, assetNames, loading }) {
  if (loading) {
    return <span className="text-slate-400 text-sm">Cargando...</span>;
  }
  if (!items?.length) {
    return <span className="text-slate-400 italic text-sm">Sin activo</span>;
  }

  const resolved = items.map((item) => {
    const rawName = assetNames[item.assetId] || item.assetId;
    const name = cleanAssetName(rawName) || rawName;
    return { id: item.assetId, name, qty: item.quantity || 1 };
  });

  const totalQty = resolved.reduce((sum, item) => sum + item.qty, 0);
  const count = resolved.length;
  const first = resolved[0];

  if (count === 1) {
    return (
      <div className="flex max-w-[220px] min-w-0 items-center gap-2">
        <CubeIcon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
        <span className="truncate text-sm text-slate-700" title={first.name}>
          {first.name}
        </span>
        {first.qty > 1 && (
          <span className="flex-shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
            ×{first.qty}
          </span>
        )}
      </div>
    );
  }

  const summaryLabel = `${count} bienes · ${totalQty} u.`;

  return (
    <div className="group relative max-w-[240px]">
      <div
        className="flex min-w-0 cursor-default items-center gap-2"
        title="Pase el cursor para ver el detalle"
      >
        <CubeIcon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
        <span className="min-w-0 truncate text-sm text-slate-700" title={first.name}>
          {first.name}
        </span>
        <span className="flex-shrink-0 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          +{count - 1}
        </span>
      </div>

      <div
        className="pointer-events-none absolute left-0 bottom-full z-50 mb-2 hidden w-72 group-hover:block"
        role="tooltip"
      >
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ring-1 ring-black/5">
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bienes del movimiento
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{summaryLabel}</p>
          </div>
          <ul className="max-h-44 overflow-y-auto py-1">
            {resolved.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="w-4 flex-shrink-0 text-right text-xs font-medium text-slate-400">
                  {index + 1}.
                </span>
                <span className="min-w-0 flex-1 truncate" title={item.name}>
                  {item.name}
                </span>
                {item.qty > 1 && (
                  <span className="flex-shrink-0 text-xs font-semibold text-slate-500">
                    ×{item.qty}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function MovementsList({
  municipalityId, 
  onView, 
  onEdit,
  onDelete,
  onRestore,
  statusFilter = null,
  typeFilter = null,
  activeFilter = 'active',
  readOwnScopeOnly = false,
  hasListFilters = false,
  movements: externalMovements = null, 
  loading: externalLoading = false, 
  error: externalError = null,
  users = [],
  persons = [],
  areas = [],
  locations = [],
  assetSearchData = {},
  municipalityLogo = null,
  municipalityName = '',
}) {
  const [internalMovements, setInternalMovements] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState(null);
  const [assetNames, setAssetNames] = useState({}); 
  const [loadingAssetNames, setLoadingAssetNames] = useState(false);
  const movements = externalMovements !== null ? externalMovements : internalMovements;
  const loading = externalMovements !== null ? externalLoading : internalLoading;
  const error = externalMovements !== null ? externalError : internalError;
  const {
    paginatedData: paginatedMovements,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
  } = usePagination(movements, 10);
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, movements.length]);
  useEffect(() => {
    if (externalMovements === null) {
      loadMovements();
    }
  }, [municipalityId, statusFilter, typeFilter, externalMovements]);
  useEffect(() => {
    if (movements && movements.length > 0) {
      loadAssetNames(movements);
    }
  }, [movements]);
  const loadMovements = async () => {
    try {
      setInternalLoading(true);
      setInternalError(null);
      let data;
      if (statusFilter) {
        data = await assetMovementService.getMovementsByStatus(statusFilter);
      } else if (typeFilter) {
        data = await assetMovementService.getMovementsByType(typeFilter);
      } else {
        data = await assetMovementService.getAllMovements();
      }
      setInternalMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setInternalError('Error al cargar los movimientos');
      console.error('Error loading movements:', err);
      setInternalMovements([]);
    } finally {
      setInternalLoading(false);
    }
  };
  const loadAssetNames = async (movementsList) => {
    if (!movementsList || movementsList.length === 0) return;
    try {
      setLoadingAssetNames(true);
      const assetIds = movementsList
        .flatMap((mov) => (Array.isArray(mov.assetIds) && mov.assetIds.length > 0 ? mov.assetIds : [mov.assetId]))
        .filter(Boolean)
        .filter((id, index, self) => self.indexOf(id) === index); 
      const namesMap = {};
      await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const asset = await getBienPatrimonialById(assetId);
            if (asset) {
              let name = asset.description || asset.descripcion || asset.assetCode || asset.codigoPatrimonial || assetId;
              name = cleanAssetName(name);
              namesMap[assetId] = name;
            } else {
              namesMap[assetId] = assetId; 
            }
          } catch (err) {
            console.warn(`Error loading asset ${assetId}:`, err);
            namesMap[assetId] = assetId; 
          }
        })
      );
      setAssetNames(prev => ({ ...prev, ...namesMap }));
    } catch (error) {
      console.error('Error loading asset names:', error);
    } finally {
      setLoadingAssetNames(false);
    }
  };
  const getStatusBadge = (status) => {
    const config = MovementStatusConfig[status] || MovementStatusConfig.REQUESTED;
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config.bgColor} mr-2`}></div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  };

  // Función para obtener el estilo del badge según el tipo de movimiento
  const getMovementTypeBadge = (movementType) => {
    const styles = {
      'INITIAL_ASSIGNMENT': {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      },
      'REASSIGNMENT': {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200'
      },
      'AREA_TRANSFER': {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200'
      },
      'EXTERNAL_TRANSFER': {
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200'
      },
      'RETURN': {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200'
      },
      'LOAN': {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200'
      },
      'MAINTENANCE': {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200'
      },
      'REPAIR': {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200'
      },
      'DISPOSAL': {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200'
      }
    };
    
    const style = styles[movementType] || {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
        {MovementTypeLabels[movementType] || movementType}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-slate-600"></div>
            <p className="text-sm text-gray-600">Cargando movimientos...</p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <XCircleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadMovements}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {movements.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 mx-auto">
            <ArrowPathIcon className="h-12 w-12 text-slate-400" />
          </div>
          {hasListFilters ? (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">Sin resultados</p>
              <p className="text-slate-500">No hay movimientos que coincidan con los filtros aplicados.</p>
            </>
          ) : activeFilter === 'inactive' ? (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">No hay movimientos inactivos</p>
              <p className="text-slate-500">No se encontraron movimientos eliminados o inactivos.</p>
            </>
          ) : activeFilter === 'all' ? (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">No hay movimientos registrados</p>
              <p className="text-slate-500">No se encontraron movimientos (activos ni inactivos) para este municipio.</p>
            </>
          ) : readOwnScopeOnly ? (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">No tienes movimientos activos</p>
              <p className="text-slate-500 max-w-md mx-auto">
                Solo ves movimientos donde eres solicitante, responsable de origen o destino, o ejecutor.
                Si creaste una solicitud, aparecerá aquí cuando esté registrada.
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">No hay movimientos activos</p>
              <p className="text-slate-500">Aún no se han registrado movimientos activos para este municipio.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'var(--color-sidebar-gradient-horizontal)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap w-36">
                  Número
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                  Activo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                  Fecha Solicitud
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                  Motivo
                </th>
                {(onView || onEdit || onDelete || onRestore) && (
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedMovements.map((movement) => (
                <tr
                  key={movement.id}
                  className="group hover:bg-blue-50/40 transition-all duration-150 bg-white border-b border-gray-100"
                >
                  <td className="px-6 py-5 w-36">
                    <div className="text-sm font-semibold text-slate-800 break-words">
                      {movement.movementNumber}
                    </div>
                  </td>
                  <td className="relative overflow-visible px-6 py-5 align-middle">
                    <MovementAssetsCell
                      items={resolveMovementAssetItems(movement)}
                      assetNames={assetNames}
                      loading={loadingAssetNames}
                    />
                  </td>
                  <td className="px-6 py-5">
                    {getMovementTypeBadge(movement.movementType)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateOnly(movement.requestDate)}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getStatusBadge(movement.movementStatus)}
                  </td>
                  <td className="px-6 py-5">
                    <div 
                      className="text-sm text-slate-800 truncate cursor-help" 
                      title={movement.reason || 'Sin motivo'}
                      style={{ maxWidth: '200px' }}
                    >
                      {movement.reason || 'Sin motivo'}
                    </div>
                  </td>
                  {(onView || onEdit || onDelete || onRestore) && (
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(movement)}
                            className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        <PdfReportButton
                          movement={movement}
                          persons={persons}
                          users={users}
                          areas={areas}
                          locations={locations}
                          assetSearchData={assetSearchData}
                          municipalityLogo={municipalityLogo}
                          municipalityName={municipalityName}
                        />
                        {(() => {
                          let isActive = true;
                          if (movement.active !== undefined) {
                            isActive = movement.active === true;
                          } else if (movement.deleted !== undefined) {
                            isActive = movement.deleted === false;
                          } else if (movement.deletedAt) {
                            isActive = false;
                          }
                          if (!isActive && onRestore) {
                            return (
                              <button
                                onClick={() => onRestore(movement)}
                                className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                                title="Restaurar"
                              >
                                <ArrowUturnLeftIcon className="h-4 w-4" />
                              </button>
                            );
                          }
                          if (onEdit && (movement.movementStatus === 'REQUESTED' || movement.movementStatus === 'APPROVED')) {
                            return (
                              <button
                                onClick={() => onEdit(movement)}
                                className="p-2.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:shadow-md"
                                title="Editar"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            );
                          }
                          return null;
                        })()}
                        {(() => {
                          let isActive = true;
                          if (movement.active !== undefined) {
                            isActive = movement.active === true;
                          } else if (movement.deleted !== undefined) {
                            isActive = movement.deleted === false;
                          } else if (movement.deletedAt) {
                            isActive = false;
                          }
                          return isActive && onDelete && (
                            <button
                              onClick={() => onDelete(movement)}
                              className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:shadow-md"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {}
      {totalItems > 0 && (
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      )}
    </div>
  );
}
