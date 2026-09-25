import { pdf } from '@react-pdf/renderer';
import ReportDocument from '../components/PatrimonioReports';

self.onmessage = async (e) => {
  const { type, items, meta, municipalityLogo, municipalityName } = e.data;
  try {
    const instance = pdf(
      <ReportDocument
        type={type}
        items={items}
        meta={meta}
        municipalityLogo={municipalityLogo}
        municipalityName={municipalityName}
      />
    );
    const blob = await instance.toBlob();
    self.postMessage({ blob });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
