import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';

const NAVY    = '#1a365d';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const CYAN_600  = '#0891b2';

const STATUS_LABELS = {
  GENERATED:        'Generada',
  PARTIALLY_SIGNED: 'Parcialmente Firmada',
  FULLY_SIGNED:     'Completamente Firmada',
  VOIDED:           'Anulada',
};

const STATUS_COLORS = {
  GENERATED:        { color: '#1d4ed8' },
  PARTIALLY_SIGNED: { color: '#92400e' },
  FULLY_SIGNED:     { color: '#065f46' },
  VOIDED:           { color: '#b91c1c' },
};

const STATUS_BORDER = {
  GENERATED:        '#1d4ed8',
  PARTIALLY_SIGNED: '#92400e',
  FULLY_SIGNED:     '#065f46',
  VOIDED:           '#b91c1c',
};

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

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 4,
    borderLeftWidth: 3, borderLeftColor: NAVY,
    padding: '8 10',
  },
  statLabel: { fontSize: 7, color: SLATE_400, textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: SLATE_800 },

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

const HandoverReceiptReport = ({ receipts, getUsernameById }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const fmtDate = (d) => d ? d.split('T')[0].split('-').reverse().join('/') : '—';

  const firmadas   = receipts.filter(r => r.receiptStatus === 'FULLY_SIGNED').length;
  const pendientes = receipts.filter(r => r.receiptStatus !== 'FULLY_SIGNED' && r.receiptStatus !== 'VOIDED').length;
  const anuladas   = receipts.filter(r => r.receiptStatus === 'VOIDED').length;
  const [logo, setLogo] = useState(null);
  useEffect(() => {
    let mounted = true;
    loadCompressedLogo(80).then(l => { if (mounted) setLogo(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <Document>
      <ReportPage logo={logo} title="Reporte de Actas de Entrega" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName="Municipalidad de San Luis">
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
          </View>
        </View>



        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={{ width: '16%' }}><Text style={styles.tableColHeader}>N° Acta</Text></View>
            <View style={{ width: '12%' }}><Text style={styles.tableColHeader}>Fecha</Text></View>
            <View style={{ width: '24%' }}><Text style={styles.tableColHeader}>Estado</Text></View>
            <View style={{ width: '24%' }}><Text style={styles.tableColHeader}>Resp. Entrega</Text></View>
            <View style={{ width: '24%' }}><Text style={styles.tableColHeader}>Resp. Recepción</Text></View>
          </View>

          {receipts.map((r, i) => {
            const sc = STATUS_COLORS[r.receiptStatus] || { color: SLATE_600 };
            const borderColor = STATUS_BORDER[r.receiptStatus] || SLATE_400;
            return (
              <View key={r.id || i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderLeftWidth: 3, borderLeftColor: borderColor }]}>
                <View style={{ width: '16%' }}><Text style={[styles.tableCol, { fontWeight: 'bold' }]}>{r.receiptNumber || '—'}</Text></View>
                <View style={{ width: '12%' }}><Text style={styles.tableCol}>{fmtDate(r.receiptDate)}</Text></View>
                <View style={{ width: '24%' }}>
                  <Text style={[styles.tableCol, { color: sc.color, fontWeight: 'bold' }]}>
                    {STATUS_LABELS[r.receiptStatus] || '—'}
                  </Text>
                </View>
                <View style={{ width: '24%' }}><Text style={styles.tableCol}>{getUsernameById(r.deliveringResponsibleId)}</Text></View>
                <View style={{ width: '24%' }}><Text style={styles.tableCol}>{getUsernameById(r.receivingResponsibleId)}</Text></View>
              </View>
            );
          })}
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

export default HandoverReceiptReport;
