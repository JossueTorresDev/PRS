import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';

const NAVY      = '#1a365d';
const TEAL      = '#0f766e';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const ROW_ALT   = '#f1f5f9';

const styles = StyleSheet.create({
  page: { padding: 36, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: {
    backgroundColor: NAVY, margin: -36, marginBottom: 28,
    paddingHorizontal: 36, paddingVertical: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle:    { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  headerSubtitle: { color: '#94a3b8', fontSize: 8, marginTop: 3 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingBottom: 12, marginBottom: 20,
    borderBottomWidth: 1, borderBottomColor: SLATE_200,
  },
  metaLabel: { fontSize: 7, color: SLATE_400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 8, color: SLATE_600, fontWeight: 'bold' },
  sectionWrap: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: TEAL,
    paddingLeft: 8, paddingVertical: 4, marginBottom: 6,
  },
  sectionTitle:   { fontSize: 8, fontWeight: 'bold', color: TEAL, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionDivider: { borderBottomWidth: 1, borderBottomColor: SLATE_200, marginBottom: 4 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 7, minHeight: 26,
  },
  fieldLabel: { width: '38%', fontSize: 8, color: SLATE_600 },
  fieldValue: { width: '62%', fontSize: 9, color: SLATE_800 },
  footer: {
    position: 'absolute', bottom: 26, left: 36, right: 36,
    fontSize: 7, color: SLATE_400, textAlign: 'center',
    borderTopWidth: 0.5, borderTopColor: SLATE_200, paddingTop: 8,
  },
  logo: { width: 72, height: 72, marginBottom: 6, objectFit: 'contain' },
});

const Field = ({ label, value, shade }) => (
  <View style={[styles.fieldRow, { backgroundColor: shade ? ROW_ALT : '#ffffff' }]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.sectionWrap}>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text></View>
    <View style={styles.sectionDivider} />
    {children}
  </View>
);

const fmtType = (t) => {
  const map = { OFFICE: 'Oficina', WAREHOUSE: 'Almacén', FIELD: 'Campo', VEHICLE: 'Vehículo', STORAGE: 'Almacenamiento', WORKSHOP: 'Taller' };
  return map[t] || t || '—';
};

const PhysicalLocationDetailReport = ({ location }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const [logo, setLogo] = useState(null);
  useEffect(() => {
    let mounted = true;
    loadCompressedLogo(80).then(l => { if (mounted) setLogo(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <Document>
      <ReportPage logo={logo} title="Detalle de Ubicación Física" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName="Municipalidad de San Luis">
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Entidad</Text>
            <Text style={styles.metaValue}>Municipalidad de San Luis</Text>
            <Text style={[styles.metaLabel, { marginTop: 6 }]}>Oficina</Text>
            <Text style={styles.metaValue}>Gerencia Municipal</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Fecha de generación</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>
          </View>
        </View>

        <Section title="Identificación">
          <Field label="Código"       value={location.locationCode}  shade={false} />
          <Field label="ID Municipio" value={location.municipalityId} shade={true} />
        </Section>

        <Section title="Información General">
          <Field label="Nombre"      value={location.name}                shade={false} />
          <Field label="Tipo"        value={fmtType(location.locationType)} shade={true} />
          <Field label="Descripción" value={location.description}         shade={false} />
        </Section>

        <Section title="Ubicación">
          <Field label="Dirección"  value={location.address}   shade={false} />
          <Field label="Piso"       value={location.floor != null ? String(location.floor) : null} shade={true} />
          <Field label="Sector"     value={location.sector}    shade={false} />
          <Field label="Referencia" value={location.reference} shade={true} />
        </Section>

        <Section title="Capacidad">
          <Field label="Capacidad Máxima" value={location.maxCapacity ? `${location.maxCapacity} personas` : null} shade={false} />
          <Field label="Área"             value={location.areaM2 ? `${location.areaM2} m²` : null}               shade={true} />
        </Section>

        <Section title="Sistema">
          <Field label="Estado" value={location.active !== false ? 'Activa' : 'Inactiva'} shade={false} />
        </Section>

      </ReportPage>
    </Document>
  );
};

export default PhysicalLocationDetailReport;
