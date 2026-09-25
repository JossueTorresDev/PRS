import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';

const NAVY    = '#1a365d';
const BLUE    = '#1d4ed8';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const ROW_ALT   = '#f1f5f9';

const styles = StyleSheet.create({
  page: { padding: 36, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },

  // Header
  header: {
    backgroundColor: NAVY, margin: -36, marginBottom: 28,
    paddingHorizontal: 36, paddingVertical: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle:    { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  headerSubtitle: { color: '#94a3b8', fontSize: 8, marginTop: 3 },

  // Meta
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingBottom: 12, marginBottom: 20,
    borderBottomWidth: 1, borderBottomColor: SLATE_200,
  },
  metaLabel: { fontSize: 7, color: SLATE_400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 8, color: SLATE_600, fontWeight: 'bold' },

  // Sección
  sectionWrap: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: BLUE,
    paddingLeft: 8, paddingVertical: 4,
    marginBottom: 6,
  },
  sectionTitle:   { fontSize: 8, fontWeight: 'bold', color: BLUE, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionDivider: { borderBottomWidth: 1, borderBottomColor: SLATE_200, marginBottom: 4 },

  // Field
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 7,
    minHeight: 26,
  },
  fieldLabel: { width: '38%', fontSize: 8, color: SLATE_600 },
  fieldValue: { width: '62%', fontSize: 9, color: SLATE_800 },

  // Firmas finales
  signatureSection: { marginTop: 44, flexDirection: 'row', justifyContent: 'space-around' },
  signatureBox:     { width: 150, alignItems: 'center' },
  signatureLine:    { width: '100%', borderTopWidth: 1, borderTopColor: SLATE_800, marginBottom: 5 },
  signatureLabel:   { fontSize: 8, color: SLATE_800, fontWeight: 'bold' },
  signatureSub:     { fontSize: 7, color: SLATE_400, marginTop: 2 },

  // Footer
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
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionDivider} />
    {children}
  </View>
);

const fmtDate = (d) => {
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
};

const PositionDetailReport = ({ position }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const [logo, setLogo] = useState(null);
  useEffect(() => {
    let mounted = true;
    loadCompressedLogo(80).then(l => { if (mounted) setLogo(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <Document>
      <ReportPage logo={logo} title="Detalle de Cargo" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName="Municipalidad de San Luis">
        {/* Meta */}
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

        {/* Identificación */}
        <Section title="Identificación">
          <Field label="Código"       value={position.positionCode}   shade={false} />
          <Field label="ID Municipio" value={position.municipalityId} shade={true} />
        </Section>

        {/* Información General */}
        <Section title="Información General">
          <Field label="Nombre"      value={position.name}        shade={false} />
          <Field label="Descripción" value={position.description} shade={true} />
        </Section>

        {/* Jerarquía y Salario */}
        <Section title="Jerarquía y Salario">
          <Field label="Nivel Jerárquico" value={position.hierarchicalLevel != null ? `Nivel ${position.hierarchicalLevel}` : null} shade={false} />
          <Field label="Salario Base"     value={position.baseSalary != null ? `S/. ${position.baseSalary.toFixed(2)}` : null}      shade={true} />
        </Section>

        {/* Sistema */}
        <Section title="Sistema">
          <Field label="Fecha de Creación" value={fmtDate(position.createdAt)}              shade={false} />
          <Field label="Estado"            value={position.active ? 'Activo' : 'Inactivo'}  shade={true} />
        </Section>

      </ReportPage>
    </Document>
  );
};

export default PositionDetailReport;

