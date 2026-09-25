import { useState, useMemo, useRef, useEffect } from 'react';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { UserIcon as UserIconSolid, CalendarIcon as CalendarIconSolid } from '@heroicons/react/24/solid';
import { PDFDownloadLink } from '@react-pdf/renderer';
import HandoverReceiptReport from '../../reports/HandoverReceiptReport';
import HandoverReceiptDetailReport from '../../reports/HandoverReceiptDetailReport';
import { usePermissions } from '../../../../hooks/usePermissions';
const statusConfig = {
  GENERATED: {
    label: 'Generado',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    Icon: DocumentTextIcon,
  },
  PARTIALLY_SIGNED: {
    label: 'Parcialmente Firmado',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    Icon: ClockIcon,
  },
  FULLY_SIGNED: {
    label: 'Completamente Firmado',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    Icon: CheckBadgeIcon,
  },
  VOIDED: {
    label: 'No Vigente',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    Icon: XCircleIcon,
  }
};
export default function HandoverReceiptList({
  receipts = [],
  users = [],
  persons = [], 
  movements = [],
  assets = [],
  loading = false,
  error = null,
  onView,
  onEdit,
  onSign,
  onVoid,
  onRetry
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('GENERATED');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { canDo } = usePermissions();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions = [
    { value: '', label: 'Todos', Icon: null },
    { value: 'GENERATED', label: 'Generado', Icon: DocumentTextIcon },
    { value: 'PARTIALLY_SIGNED', label: 'Parcialmente Firmado', Icon: ClockIcon },
    { value: 'FULLY_SIGNED', label: 'Completamente Firmado', Icon: CheckBadgeIcon },
    { value: 'VOIDED', label: 'No Vigente', Icon: XCircleIcon },
  ];

  const selectedOption = statusOptions.find(o => o.value === statusFilter) || statusOptions[0];
  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const matchSearch = !searchTerm || receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = !statusFilter || receipt.receiptStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [receipts, searchTerm, statusFilter]);
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, startIndex + itemsPerPage);

  const getPersonNameById = (personId) => {
    if (!personId) return 'No asignado';

    const person = persons.find(p => 
      p.id === personId || 
      p.personId === personId || 
      p.uuid === personId
    );
    
    if (person) {
      
      const firstName = person.firstName || person.first_name || '';
      const middleName = person.middleName || person.middle_name || '';
      const lastName = person.lastName || person.last_name || '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      
      const personType = person.personType || person.person_type;
      if (personType === 'J' || personType === 'JURIDICA') {
        return person.businessName || person.business_name || fullName || 'Persona Jurídica';
      }
      
      return fullName || 'Sin nombre';
    }
    
    const user = users.find(u => 
      u.id === personId || 
      u.personId === personId || 
      u.userId === personId
    );
    
    if (user) {
      return user.username || 'Usuario sin nombre';
    }
    
    return 'No asignado';
  };

  const getAssetByReceipt = (receipt) => {
    const movement = movements.find(m => String(m.id) === String(receipt.movementId));
    if (!movement?.assetId) return null;
    return assets.find(a => String(a.id) === String(movement.assetId)) || null;
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };
  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.GENERATED;
    const { Icon } = config;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p className="font-medium">{error}</p>
        <button onClick={onRetry} className="mt-2 text-sm underline hover:text-red-900">
          Intentar nuevamente
        </button>
      </div>
    );
  }
  return (
    <>
      {}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar por número de acta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center gap-2.5 pl-3 pr-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium text-sm hover:bg-gray-100 transition-all"
              >
                {selectedOption.Icon ? (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <selectedOption.Icon className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="h-3.5 w-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                )}
                <span className="flex-1 text-left truncate">{selectedOption.label}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {statusOptions.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setStatusFilter(value); setDropdownOpen(false); setCurrentPage(1); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors ${statusFilter === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                    >
                      {Icon ? (
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="h-3.5 w-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Exportar
            </label>
            <PDFDownloadLink
              document={<HandoverReceiptReport receipts={filteredReceipts} getUsernameById={getPersonNameById} />}
              fileName={`reporte_actas_${new Date().toISOString().slice(0, 10)}.pdf`}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium hover:bg-blue-600 hover:text-white transition-all text-sm group/btn"
            >
              {({ loading }) => (
                <>
                  <svg className="w-5 h-5 text-blue-600 group-hover/btn:text-white flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
                  </svg>
                  {loading ? "Preparando..." : "Exportar PDF"}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
      {}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-48">Número de Acta</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-28">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-36">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-36">Resp. Entrega</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-36">Resp. Recepción</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron actas</p>
                      <p className="text-slate-500">Intenta con otros filtros o crea una nueva acta</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReceipts
                  .sort((a, b) => a.receiptNumber.localeCompare(b.receiptNumber))
                  .map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="group hover:bg-slate-50 transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-white"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{receipt.receiptNumber}</p>
                          <p className="text-xs text-slate-500">ID: {receipt.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <CalendarIconSolid className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{formatDate(receipt.receiptDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(receipt.receiptStatus)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <UserIconSolid className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm text-slate-700 max-w-[110px] truncate" title={getPersonNameById(receipt.deliveringResponsibleId)}>{getPersonNameById(receipt.deliveringResponsibleId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <UserIconSolid className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm text-slate-700 max-w-[110px] truncate" title={getPersonNameById(receipt.receivingResponsibleId)}>{getPersonNameById(receipt.receivingResponsibleId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onView && onView(receipt)}
                          className="p-2.5 text-slate-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-blue-600"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <PDFDownloadLink
                          document={<HandoverReceiptDetailReport receipt={receipt} getUsernameById={getPersonNameById} asset={getAssetByReceipt(receipt)} />}
                          fileName={`acta_${receipt.receiptNumber}.pdf`}
                          className="p-2.5 text-slate-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-rose-600"
                          title="Generar PDF"
                        >
                          {() => (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
                            </svg>
                          )}
                        </PDFDownloadLink>
                        {receipt.receiptStatus !== 'FULLY_SIGNED' && receipt.receiptStatus !== 'VOIDED' && (
                          <>
                            {canDo('movimientos', 'receipt', 'generate') && (
                            <button
                              onClick={() => onEdit && onEdit(receipt)}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-emerald-600"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            )}
                            {canDo('movimientos', 'receipt', 'sign') && (
                            <button
                              onClick={() => onSign && onSign(receipt)}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-purple-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-purple-600"
                              title="Firmar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            )}
                            {canDo('movimientos', 'receipt', 'void') && (
                            <button
                              onClick={() => onVoid && onVoid(receipt)}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-red-600"
                              title="Marcar como No Vigente"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {}
        {filteredReceipts.length > itemsPerPage && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredReceipts.length)} de {filteredReceipts.length} actas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
