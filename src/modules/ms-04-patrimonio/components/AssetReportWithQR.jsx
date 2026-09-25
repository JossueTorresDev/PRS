import React, { useState, useRef, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import ReportDocument from './PatrimonioReports';

const buildQRText = (asset) => {
  const qrData = {
    codigo: asset.assetCode || asset.codigoPatrimonial || '-',
    descripcion: asset.description || asset.descripcion || '-',
    marca: asset.brand || asset.marca || '-',
    modelo: asset.model || asset.modelo || '-',
    estado: asset.assetStatus || asset.estadoBien || '-',
    ubicacion: asset.ubicacionActual || asset.location?.name || '-',
    categoria: asset.category?.name || asset.categoria || '-'
  };

  return `BIEN PATRIMONIAL
${'\u2501'.repeat(22)}
Código: ${qrData.codigo}
Descripción: ${qrData.descripcion}
Marca: ${qrData.marca}
Modelo: ${qrData.modelo}
Estado: ${qrData.estado}
Ubicación: ${qrData.ubicacion}
Categoría: ${qrData.categoria}`;
};

export default function AssetReportWithQR({ asset, fileName, children }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);

  const handleClick = useCallback(async (e) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);

    try {
      const qrText = buildQRText(asset);

      const qrDataUrl = await QRCode.toDataURL(qrText, {
        width: 120,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });

      const blob = await pdf(
        <ReportDocument
          type="bien"
          items={[asset]}
          meta={{
            title: `Ficha Bien ${asset.assetCode || asset.codigoPatrimonial}`,
            badge: 'FICHA',
            qrDataUrl
          }}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `bien_${asset.assetCode || asset.codigoPatrimonial || asset.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setIsGenerating(false);
      generatingRef.current = false;
    }
  }, [asset, fileName]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isGenerating}
      className="inline-flex items-center"
    >
      {typeof children === 'function' ? children({ loading: isGenerating }) : children}
    </button>
  );
}

export async function generateAssetPDF(asset) {
  const qrText = buildQRText(asset);

  const qrDataUrl = await QRCode.toDataURL(qrText, {
    width: 120,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M'
  });

  const blob = await pdf(
    <ReportDocument
      type="bien"
      items={[asset]}
      meta={{
        title: `Ficha Bien ${asset.assetCode || asset.codigoPatrimonial}`,
        badge: 'FICHA',
        qrDataUrl
      }}
    />
  ).toBlob();

  return blob;
}
