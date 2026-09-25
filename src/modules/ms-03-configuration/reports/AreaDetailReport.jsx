import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';

const NAVY      = '#1a365d';
const EMERALD   = '#059669';
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
    borderLeftWidth: 4, borderLeftColor: EMERALD,
    paddingLeft: 8, paddingVertical: 4,
    marginBottom: 6,
  },
  sectionTitle:   { fontSize: 8, fontWeight: 'bold', color: EMERALD, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionDivider: { borderBottomWidth: 1, borderBottomColor: SLATE_200, marginBottom: 4 },

  // Field
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 7,
    minHeight: 26,
  },
  fieldLabel: { width: '38%', fontSize: 8, color: SLATE_600 },
  fieldValue: { width: '62%', fontSize: 9, color: SLATE_800 },

  // Firmas
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

const fmtCurrency = (val) =>
  val != null ? `S/. ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(val)}` : '—';

const AreaDetailReport = ({ area }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const [logo, setLogo] = useState(() => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('muniLogo') : null));
  useEffect(() => {
    let mounted = true;
    loadCompressedLogo(80).then(l => {
      if (!mounted) return;
      if (l) setLogo(l);
      else if (typeof sessionStorage !== 'undefined') setLogo(sessionStorage.getItem('muniLogo') || null);
    }).catch(() => {
      if (mounted && typeof sessionStorage !== 'undefined') setLogo(sessionStorage.getItem('muniLogo') || null);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <Document>
      <ReportPage logo={logo} title="Detalle de Área" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName="Municipalidad de San Luis">
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
          <Field label="Código de Área"   value={area.areaCode}       shade={false} />
          <Field label="ID Municipio"     value={area.municipalityId} shade={true}  />
          <Field label="Nivel Jerárquico" value={area.hierarchicalLevel != null ? `Nivel ${area.hierarchicalLevel}` : null} shade={false} />
        </Section>

        {/* Información General */}
        <Section title="Información General">
          <Field label="Nombre"      value={area.name}        shade={false} />
          <Field label="Descripción" value={area.description} shade={true}  />
        </Section>

        {/* Contacto y Ubicación */}
        <Section title="Contacto y Ubicación">
          <Field label="Ubicación Física" value={area.physicalLocation} shade={false} />
          <Field label="Teléfono"         value={area.phone}            shade={true}  />
          <Field label="Email"            value={area.email}            shade={false} />
        </Section>

        {/* Presupuesto */}
        <Section title="Presupuesto">
          <Field label="Presupuesto Anual" value={fmtCurrency(area.annualBudget)} shade={false} />
        </Section>

        {/* Sistema */}
        <Section title="Sistema">
          <Field label="Estado" value={area.active ? 'Activa' : 'Inactiva'} shade={false} />
        </Section>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
            <Text style={styles.signatureSub}>SIPREB - San Luis</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Jefe de Área</Text>
            <Text style={styles.signatureSub}>Gerencia Municipal</Text>
          </View>
        </View>

      </ReportPage>
    </Document>
  );
};

export default AreaDetailReport;
