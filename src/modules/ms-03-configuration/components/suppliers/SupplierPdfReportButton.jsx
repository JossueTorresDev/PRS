import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import SupplierDetailReport, { buildSupplierDetailReportTitle } from '../../reports/SupplierDetailReport';
import { openPdfInBrowser } from '../../utils/openPdfReport';

export default function SupplierPdfReportButton({ proveedor, municipalityLogo, municipalityName }) {
  const [generating, setGenerating] = useState(false);

  const handleClick = async () => {
    if (generating || !proveedor) return;
    setGenerating(true);
    try {
      const blob = await pdf(
        <SupplierDetailReport
          proveedor={proveedor}
          municipalityLogo={municipalityLogo}
          municipalityName={municipalityName}
        />
      ).toBlob();
      openPdfInBrowser(blob, buildSupplierDetailReportTitle(proveedor));
    } catch {
      /* sin blob */
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      type="button"
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
