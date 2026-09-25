import React from 'react';
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage } from '../../../shared/reports';

const NAVY = '#1a365d';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_200 = '#e2e8f0';
const CYAN_600 = '#0891b2';

const styles = StyleSheet.create({
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: SLATE_200,
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
  table: { display: 'table', width: 'auto', marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 2 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    minHeight: 28,
    alignItems: 'center',
  },
  tableColHeader: { padding: 6, color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  tableCol: { padding: 6, fontSize: 8, color: SLATE_800 },
});

export const SUPPLIER_LIST_REPORT_TITLE = 'Reporte General de Proveedores';

const SupplierReport = ({ proveedores = [], municipalityLogo, municipalityName }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const getCompanyTypeLabel = (companyType) => {
    const types = {
      MICRO_EMPRESA: 'Micro',
      PEQUENA_EMPRESA: 'Pequeña',
      MEDIANA_EMPRESA: 'Mediana',
      GRAN_EMPRESA: 'Grande',
      'PERSONA NATURAL': 'P. Natural',
    };
    return types[companyType] || companyType || 'N/A';
  };

  return (
    <Document title={SUPPLIER_LIST_REPORT_TITLE}>
      <ReportPage
        logo={municipalityLogo}
        title={SUPPLIER_LIST_REPORT_TITLE}
        subtitle="Listado nominal del sistema"
        muniName={municipalityName}
        orientation="landscape"
      >
        <View style={styles.metaSection}>
          <View>
            <Text style={styles.metaText}>Oficina: Gerencia Municipal</Text>
          </View>
          <View>
            <Text style={styles.reportTypeBadge}>LISTADO DE PROVEEDORES</Text>
            <Text style={[styles.metaText, { marginTop: 4 }]}>Generado: {dateStr}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={{ width: '13%' }}><Text style={styles.tableColHeader}>RUC/Doc</Text></View>
            <View style={{ width: '25%' }}><Text style={styles.tableColHeader}>Razón Social</Text></View>
            <View style={{ width: '12%' }}><Text style={styles.tableColHeader}>Tipo Empresa</Text></View>
            <View style={{ width: '15%' }}><Text style={styles.tableColHeader}>Contacto</Text></View>
            <View style={{ width: '12%' }}><Text style={styles.tableColHeader}>Teléfono</Text></View>
            <View style={{ width: '15%' }}><Text style={styles.tableColHeader}>Email</Text></View>
            <View style={{ width: '8%' }}><Text style={styles.tableColHeader}>Estado</Text></View>
          </View>

          {proveedores.map((p, i) => (
            <View key={p.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
              <View style={{ width: '13%' }}><Text style={styles.tableCol}>{p.numeroDocumento || 'N/A'}</Text></View>
              <View style={{ width: '25%' }}><Text style={styles.tableCol}>{p.legalName || 'N/A'}</Text></View>
              <View style={{ width: '12%' }}><Text style={styles.tableCol}>{getCompanyTypeLabel(p.companyType)}</Text></View>
              <View style={{ width: '15%' }}><Text style={styles.tableCol}>{p.mainContact || 'N/A'}</Text></View>
              <View style={{ width: '12%' }}><Text style={styles.tableCol}>{p.phone || 'N/A'}</Text></View>
              <View style={{ width: '15%' }}><Text style={styles.tableCol}>{p.email || 'N/A'}</Text></View>
              <View style={{ width: '8%' }}><Text style={styles.tableCol}>{p.active ? 'Activo' : 'Inactivo'}</Text></View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
          <Text style={{ fontSize: 9, color: SLATE_800, fontWeight: 'bold' }}>
            Total de registros: {proveedores.length} proveedores en el sistema.
            {'  '}Activos: {proveedores.filter(p => p.active).length}
            {'  '}Inactivos: {proveedores.filter(p => !p.active).length}
          </Text>
        </View>
      </ReportPage>
    </Document>
  );
};

export default SupplierReport;
