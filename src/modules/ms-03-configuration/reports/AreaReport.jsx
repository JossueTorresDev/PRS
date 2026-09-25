import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';

const NAVY      = '#1a365d';
const EMERALD   = '#059669';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';

const styles = StyleSheet.create({
  page: { padding: 36, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },

  // Header
  header: {
    backgroundColor: NAVY, margin: -36, marginBottom: 28,
    padding: 36, paddingBottom: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle:    { color: '#ffffff', fontSize: 15, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  headerSubtitle: { color: '#cbd5e1', fontSize: 8, marginTop: 4 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)', padding: '4 10',
    borderRadius: 4, color: '#ffffff', fontSize: 8, fontWeight: 'bold',
  },

  // Meta
  metaSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 18, borderBottomWidth: 1, borderBottomColor: SLATE_200, paddingBottom: 10,
  },
  metaLabel: { fontSize: 7, color: SLATE_400, textTransform: 'uppercase', marginBottom: 1 },
  metaValue: { fontSize: 8, color: SLATE_600 },

  // Table
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 3 },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: SLATE_200, minHeight: 28, alignItems: 'center',
  },
  tableColHeader: { padding: '5 6', color: '#ffffff', fontSize: 7.5, fontWeight: 'bold' },
  tableCol:       { padding: '5 6', fontSize: 7.5, color: SLATE_800 },

  // Signatures
  signatureSection: { marginTop: 44, flexDirection: 'row', justifyContent: 'space-around' },
  signatureBox: {
    width: 140, borderTopWidth: 1, borderTopColor: SLATE_800,
    paddingTop: 6, alignItems: 'center',
  },
  signatureLabel: { fontSize: 8, color: SLATE_800, fontWeight: 'bold' },
  signatureSub:   { fontSize: 7, color: SLATE_600, marginTop: 2 },

  // Footer
  footer: {
    position: 'absolute', bottom: 28, left: 36, right: 36,
    fontSize: 7, color: SLATE_400, textAlign: 'center',
    borderTopWidth: 0.5, borderTopColor: SLATE_200, paddingTop: 8,
  },
  logo: { width: 60, height: 60, marginBottom: 6, objectFit: 'contain' },
});

const AreaReport = ({ areas }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const activos   = areas.filter(a => a.active).length;
  const inactivos = areas.length - activos;
  const [logo, setLogo] = useState(null);
  useEffect(() => {
    let mounted = true;
    loadCompressedLogo(80).then(l => { if (mounted) setLogo(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <Document>
      <ReportPage logo={logo} title="Reporte General de Áreas" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName="Municipalidad de San Luis">
        {/* Meta */}
        <View style={styles.metaSection}>
          <View>
            <Text style={styles.metaLabel}>Entidad</Text>
            <Text style={styles.metaValue}>Municipalidad de San Luis</Text>
            <Text style={[styles.metaLabel, { marginTop: 4 }]}>Oficina</Text>
            <Text style={styles.metaValue}>Gerencia Municipal</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Fecha de generación</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>
            <Text style={[styles.metaLabel, { marginTop: 4 }]}>Total registros</Text>
            <Text style={styles.metaValue}>{areas.length} ({activos} activas / {inactivos} inactivas)</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={{ width: '12%' }}><Text style={styles.tableColHeader}>Código</Text></View>
            <View style={{ width: '28%' }}><Text style={styles.tableColHeader}>Nombre</Text></View>
            <View style={{ width: '22%' }}><Text style={styles.tableColHeader}>Ubicación Física</Text></View>
            <View style={{ width: '18%' }}><Text style={styles.tableColHeader}>Email</Text></View>
            <View style={{ width: '12%' }}><Text style={styles.tableColHeader}>Teléfono</Text></View>
            <View style={{ width: '8%' }}><Text style={styles.tableColHeader}>Estado</Text></View>
          </View>

          {areas.map((area, i) => (
            <View key={area.id || i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
              <View style={{ width: '12%' }}><Text style={[styles.tableCol, { fontWeight: 'bold' }]}>{area.areaCode || '—'}</Text></View>
              <View style={{ width: '28%' }}><Text style={styles.tableCol}>{area.name || '—'}</Text></View>
              <View style={{ width: '22%' }}><Text style={styles.tableCol}>{area.physicalLocation || '—'}</Text></View>
              <View style={{ width: '18%' }}><Text style={styles.tableCol}>{area.email || '—'}</Text></View>
              <View style={{ width: '12%' }}><Text style={styles.tableCol}>{area.phone || '—'}</Text></View>
              <View style={{ width: '8%' }}>
                <Text style={[styles.tableCol, { color: area.active ? '#16a34a' : SLATE_400, fontWeight: 'bold', textAlign: 'center' }]}>
                  {area.active ? 'Activa' : 'Inactiva'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
            <Text style={styles.signatureSub}>SIPREB - San Luis</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Jefe de Área</Text>
            <Text style={styles.signatureSub}>Gerencia Municipal</Text>
          </View>
        </View>

      </ReportPage>
    </Document>
  );
};

export default AreaReport;
