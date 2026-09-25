import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage } from '../../../shared/reports';
import { getCompanyTypeLabel, getClassificationLabel } from '../components/suppliers/supplier.constants';

const NAVY = '#1a365d';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const CYAN_600 = '#0891b2';

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  metaText: { fontSize: 8, color: SLATE_600 },
  reportTypeBadge: {
    backgroundColor: '#f1f5f9',
    padding: '4 10',
    borderRadius: 4,
    color: CYAN_600,
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: NAVY,
    padding: '6 12',
    borderRadius: 3,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: SLATE_400,
    borderStyle: 'solid',
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_400,
    borderBottomStyle: 'solid',
  },
  tableRowLast: { flexDirection: 'row' },
  tableCell: {
    width: '50%',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: SLATE_400,
    borderRightStyle: 'solid',
  },
  tableCellLast: { width: '50%', padding: 8 },
  tableCellContent: { flexDirection: 'row', alignItems: 'flex-start' },
  tableCellLabelInline: {
    fontSize: 9,
    color: SLATE_800,
    fontWeight: 'bold',
    marginRight: 4,
  },
  tableCellValueInline: { fontSize: 9, color: SLATE_600, flex: 1 },
  statusBadge: {
    padding: '3 8',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
});

const getDocumentTypeName = (documentTypesId) => {
  switch (documentTypesId) {
    case 1: return 'DNI';
    case 2: return 'RUC';
    case 3: return 'CE';
    case 4: return 'Pasaporte';
    default: return 'Documento';
  }
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

const display = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
};

const TableRow = ({ label1, value1, label2, value2, isLast = false }) => (
  <View style={isLast ? styles.tableRowLast : styles.tableRow}>
    <View style={styles.tableCell}>
      <View style={styles.tableCellContent}>
        <Text style={styles.tableCellLabelInline}>{label1}</Text>
        <Text style={styles.tableCellValueInline}>{value1 || 'N/A'}</Text>
      </View>
    </View>
    <View style={styles.tableCellLast}>
      <View style={styles.tableCellContent}>
        <Text style={styles.tableCellLabelInline}>{label2}</Text>
        <Text style={styles.tableCellValueInline}>{value2 || 'N/A'}</Text>
      </View>
    </View>
  </View>
);

const TableRowFull = ({ label, value, isLast = false }) => (
  <View style={isLast ? styles.tableRowLast : styles.tableRow}>
    <View style={[styles.tableCell, { width: '100%', borderRightWidth: 0 }]}>
      <View style={styles.tableCellContent}>
        <Text style={styles.tableCellLabelInline}>{label}</Text>
        <Text style={styles.tableCellValueInline}>{value || 'N/A'}</Text>
      </View>
    </View>
  </View>
);

export const buildSupplierDetailReportTitle = (proveedor) => {
  const name = String(proveedor?.legalName || proveedor?.tradeName || '').trim();
  if (name) return `Proveedor - ${name}`;
  if (proveedor?.numeroDocumento) return `Proveedor - ${proveedor.numeroDocumento}`;
  return 'Detalle de Proveedor';
};

const SupplierDetailReport = ({ proveedor, municipalityLogo, municipalityName }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportTitle = buildSupplierDetailReportTitle(proveedor);
  const estadoActivo = proveedor?.active ? 'Activo' : 'Inactivo';
  const estadoColors = proveedor?.active
    ? { bg: '#dcfce7', color: '#166534' }
    : { bg: '#fee2e2', color: '#991b1b' };

  return (
    <Document title={reportTitle}>
      <ReportPage
        logo={municipalityLogo}
        title="Detalle de Proveedor"
        subtitle="Listado nominal del sistema"
        muniName={municipalityName}
      >
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaText}>Oficina: Gerencia Municipal</Text>
            <Text style={styles.metaText}>
              {getDocumentTypeName(proveedor?.documentTypesId)}: {display(proveedor?.numeroDocumento)}
            </Text>
          </View>
          <View>
            <Text style={styles.reportTypeBadge}>FICHA DE PROVEEDOR</Text>
            <Text style={[styles.metaText, { marginTop: 4, textAlign: 'right' }]}>
              Generado: {dateStr}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
              <Text style={[styles.metaText, { marginRight: 6 }]}>Estado:</Text>
              <View style={[styles.statusBadge, { backgroundColor: estadoColors.bg }]}>
                <Text style={{ color: estadoColors.color, fontSize: 8, fontWeight: 'bold' }}>
                  {estadoActivo}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.table}>
            <TableRow
              label1="Razón Social:"
              value1={proveedor?.legalName}
              label2="Nombre Comercial:"
              value2={proveedor?.tradeName}
            />
            <TableRow
              label1="Tipo de Documento:"
              value1={getDocumentTypeName(proveedor?.documentTypesId)}
              label2="N° Documento:"
              value2={proveedor?.numeroDocumento}
            />
            <TableRowFull
              label="Dirección Legal:"
              value={proveedor?.address}
              isLast={!proveedor?.isStateProvider}
            />
            {proveedor?.isStateProvider && (
              <TableRowFull label="Proveedor del Estado:" value="Sí" isLast />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          <View style={styles.table}>
            <TableRow
              label1="Teléfono:"
              value1={proveedor?.phone}
              label2="Email:"
              value2={proveedor?.email}
            />
            <TableRow
              label1="Sitio Web:"
              value1={proveedor?.website}
              label2="Contacto Principal:"
              value2={proveedor?.mainContact}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Tributaria</Text>
          <View style={styles.table}>
            <TableRow
              label1="Tipo de Empresa:"
              value1={getCompanyTypeLabel(proveedor?.companyType)}
              label2="Clasificación:"
              value2={getClassificationLabel(proveedor?.classification)}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Sistema</Text>
          <View style={styles.table}>
            <TableRow
              label1="Fecha de Registro:"
              value1={fmtDate(proveedor?.createdAt)}
              label2="Última Actualización:"
              value2={fmtDate(proveedor?.updatedAt)}
              isLast
            />
          </View>
        </View>
      </ReportPage>
    </Document>
  );
};

export default SupplierDetailReport;
