import { PDFDownloadLink } from '@react-pdf/renderer';
import { MunicipalidadesReportDocument, MunicipalidadDetailReportDocument } from '../reports/MunicipalidadesReport';

export const useMunicipalidadReports = () => {
  const generateListReport = (municipalidades, meta = {}) => {
    return (
      <PDFDownloadLink
        document={<MunicipalidadesReportDocument municipalidades={municipalidades} meta={meta} />}
        fileName={`municipalidades-${new Date().getTime()}.pdf`}
      >
        {({ blob, url, loading, error }) => 
          loading ? 'Generando PDF...' : 'Descargar Listado'
        }
      </PDFDownloadLink>
    );
  };

  const generateDetailReport = (municipalidad, meta = {}) => {
    return (
      <PDFDownloadLink
        document={<MunicipalidadDetailReportDocument municipalidad={municipalidad} meta={meta} />}
        fileName={`municipalidad-${municipalidad?.nombre || 'detalle'}-${new Date().getTime()}.pdf`}
      >
        {({ blob, url, loading, error }) => 
          loading ? 'Generando PDF...' : 'Descargar Ficha'
        }
      </PDFDownloadLink>
    );
  };

  return {
    generateListReport,
    generateDetailReport,
    MunicipalidadesReportDocument,
    MunicipalidadDetailReportDocument
  };
};
