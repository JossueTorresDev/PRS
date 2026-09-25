import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { getDisposalDetailsByDisposalId, DISPOSAL_TYPES } from '../../services/disposalService';

const CONSERVATION_LABELS = {
    GOOD: { label: 'Bueno', color: 'bg-green-100 text-green-700' },
    REGULAR: { label: 'Regular', color: 'bg-yellow-100 text-yellow-700' },
    BAD: { label: 'Malo', color: 'bg-red-100 text-red-700' },
    OBSOLETE: { label: 'Obsoleto', color: 'bg-gray-100 text-gray-700' },
};

const RECOMMENDATION_LABELS = {
    DESTROY: { label: 'Destruir', icon: '🗑️' },
    DONATE: { label: 'Donar', icon: '🤝' },
    SELL: { label: 'Vender', icon: '💰' },
    RECYCLE: { label: 'Reciclar', icon: '♻️' },
    TRANSFER: { label: 'Transferir', icon: '🔄' },
};

const getTypeLabel = (type) => {
    const typeObj = DISPOSAL_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
};

export default function ViewDisposalAssetsModal({ isOpen, onClose, disposal }) {
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [generatingQR, setGeneratingQR] = useState(false);

    useEffect(() => {
        if (isOpen && disposal?.id) {
            loadDetails();
        }
    }, [isOpen, disposal?.id]);

    const loadDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDisposalDetailsByDisposalId(disposal.id);
            setDetails(data);
        } catch (err) {
            setError('No se pudieron cargar los bienes del expediente.');
        } finally {
            setLoading(false);
        }
    };

    const showQRCode = async (asset) => {
        setGeneratingQR(true);
        setSelectedAsset(asset);
        try {
            const qrValue = asset.assetCode || asset.codigoPatrimonial || '';
            const assetName = asset.assetDescription || asset.nombre || asset.name || asset.assetName || asset.descripcion || asset.description || '-';

            const qrText = [
                'BIEN PATRIMONIAL - BAJA',
                '\u2501'.repeat(22),
                `Código: ${qrValue}`,
                `Nombre del Bien: ${assetName}`,
                `Expediente: ${disposal.fileNumber || '-'}`,
                `Motivo: ${getTypeLabel(disposal.disposalReason || disposal.name) || '-'}`,
            ].join('\n');

            const qrUrl = await QRCode.toDataURL(qrText, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
            });
            setQrDataUrl(qrUrl);
        } catch (err) {
            console.error('Error generando QR:', err);
            setQrDataUrl(null);
        } finally {
            setGeneratingQR(false);
        }
    };

    const downloadQRCode = () => {
        if (qrDataUrl && selectedAsset) {
            const link = document.createElement('a');
            link.href = qrDataUrl;
            link.download = `QR_${selectedAsset.assetCode || 'asset'}.png`;
            link.click();
        }
    };

    const closeQRModal = () => {
        setSelectedAsset(null);
        setQrDataUrl(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="bg-slate-800 rounded-t-2xl px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">Bienes del Expediente</h2>
                            <p className="text-slate-300 text-sm">{disposal?.fileNumber}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-slate-600 mb-4" />
                            <p className="text-slate-500 text-sm">Cargando bienes...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-600 font-medium">{error}</p>
                            <button onClick={loadDetails} className="mt-3 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors">
                                Reintentar
                            </button>
                        </div>
                    ) : details.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-slate-600 font-semibold text-lg mb-1">Sin bienes registrados</p>
                            <p className="text-slate-400 text-sm">Este expediente no tiene bienes agregados aún.</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary bar */}
                            <div className="flex items-center gap-2 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-slate-600 text-sm font-medium">
                                    <strong>{details.length}</strong> bien{details.length !== 1 ? 'es' : ''} en este expediente
                                </span>
                                <span className="ml-auto text-slate-500 text-sm">
                                    Valor total: <strong className="text-slate-800">
                                        S/ {details.reduce((sum, d) => sum + (parseFloat(d.bookValue) || 0), 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </strong>
                                </span>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Código / Bien</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Conservación</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">Valor Libro</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">Val. Recuperable</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Recomendación</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">QR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {details.map((detail, index) => {
                                            const conservation = CONSERVATION_LABELS[detail.conservationStatus] || { label: detail.conservationStatus, color: 'bg-gray-100 text-gray-700' };
                                            const recommendation = detail.recommendation ? RECOMMENDATION_LABELS[detail.recommendation] : null;
                                            return (
                                                <tr key={detail.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-4 py-4 text-slate-400 font-medium">{index + 1}</td>
                                                    <td className="px-4 py-4">
                                                        <p className="font-semibold text-slate-800">
                                                            {detail.assetCode || <span className="text-slate-400 font-normal text-xs">ID: {detail.assetId?.substr(0, 8)}...</span>}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                            {detail.assetDescription || detail.observations || '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${conservation.color}`}>
                                                            {conservation.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-semibold text-slate-800">
                                                        S/ {parseFloat(detail.bookValue || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-slate-600">
                                                        S/ {parseFloat(detail.recoverableValue || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {recommendation ? (
                                                            <span className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                                                                <span>{recommendation.icon}</span>
                                                                <span>{recommendation.label}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Sin definir</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => showQRCode(detail)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Ver código QR"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            {/* QR Code Modal */}
            {selectedAsset && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={closeQRModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        {/* QR Header */}
                        <div className="bg-slate-800 rounded-t-2xl px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Código QR del Bien</h3>
                                    <p className="text-slate-300 text-sm">{selectedAsset.assetCode || selectedAsset.codigoPatrimonial || 'Sin código'}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeQRModal}
                                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* QR Body */}
                        <div className="p-6">
                            {generatingQR ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4" />
                                    <p className="text-slate-500 text-sm">Generando QR...</p>
                                </div>
                            ) : qrDataUrl ? (
                                <div className="flex flex-col items-center">
                                    {/* QR Image */}
                                    <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-inner mb-4">
                                        <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                                    </div>

                                    {/* Asset Info */}
                                    <div className="w-full bg-slate-50 rounded-xl p-4 mb-4">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Código</p>
                                                <p className="text-slate-800 font-semibold text-sm">
                                                    {selectedAsset.assetCode || selectedAsset.codigoPatrimonial || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Nombre del Bien</p>
                                                <p className="text-slate-800 font-medium text-sm">
                                                    {selectedAsset.assetDescription || selectedAsset.observations || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expediente</p>
                                                <p className="text-slate-800 font-semibold text-sm">{disposal.fileNumber || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Motivo</p>
                                                <p className="text-slate-800 font-semibold text-sm">{getTypeLabel(disposal.disposalReason || disposal.name) || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={downloadQRCode}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Descargar QR
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-red-600 font-medium">No se pudo generar el QR</p>
                                    <button onClick={() => showQRCode(selectedAsset)} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                                        Reintentar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
