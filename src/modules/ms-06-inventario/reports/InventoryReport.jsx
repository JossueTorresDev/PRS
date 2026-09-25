import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';

const NAVY      = '#1a365d';
const BLUE      = '#1d4ed8';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const ROW_ALT   = '#f1f5f9';

const STATUS_LABELS = {
  PLANNED:     'Planificado',
  IN_PROGRESS: 'En Progreso',
  IN_PROCESS:  'En Progreso',
  COMPLETED:   'Completado',
  CANCELLED:   'Cancelado',
};

const STATUS_COLORS = {
  PLANNED:     { bg: '#dbeafe', color: '#1d4ed8' },
  IN_PROGRESS: { bg: '#fef9c3', color: '#92400e' },
  IN_PROCESS:  { bg: '#fef9c3', color: '#92400e' },
  COMPLETED:   { bg: '#dcfce7', color: '#065f46' },
  CANCELLED:   { bg: '#fee2e2', color: '#b91c1c' },
};

const TYPE_LABELS = {
  GENERAL:   'General',
  PARTIAL:   'Parcial',
  SELECTIVE: 'Selectivo',
};

const normalizeStatus = (s) => {
  if (!s) return 'PLANNED';
  const n = String(s).toUpperCase().trim().replace(/\s+/g, '_');
  return n === 'IN_PROCESS' ? 'IN_PROGRESS' : n;
};

const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
};

const styles = StyleSheet.create({
  page: { padding: 36, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },

  header: {
    backgroundColor: NAVY, margin: -36, marginBottom: 0,
    paddingHorizontal: 36, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft:     { flex: 1 },
  headerTitle:    { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  headerSubtitle: { color: '#94a3b8', fontSize: 8, marginTop: 3 },
  headerBadge:    { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4, color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 18, paddingBottom: 12,
    marginBottom: 6,
    borderBottomWidth: 1, borderBottomColor: SLATE_200,
    backgroundColor: '#f8fafc',
    marginLeft: -36, marginRight: -36,
    paddingLeft: 36, paddingRight: 36,
  },
  metaLabel: { fontSize: 7, color: SLATE_400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 8, color: SLATE_600, fontWeight: 'bold' },
  // Tabla
  tableHeader: {
    flexDirection: 'row', backgroundColor: NAVY,
    paddingVertical: 7, paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7, paddingHorizontal: 8,
    borderBottomWidth: 0.5, borderBottomColor: SLATE_200,
  },
  colNum:    { width: '18%', fontSize: 8, color: '#ffffff', fontWeight: 'bold' },
  colTipo:   { width: '14%', fontSize: 8, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' },
  colEstado: { width: '18%', fontSize: 8, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' },
  colDesc:   { width: '32%', fontSize: 8, color: '#ffffff', fontWeight: 'bold' },
  colFecha:  { width: '18%', fontSize: 8, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' },

  colNumVal:    { width: '18%', fontSize: 8, color: SLATE_800, fontWeight: 'bold' },
  colTipoVal:   { width: '14%', fontSize: 8, color: SLATE_600, textAlign: 'center' },
  colEstadoVal: { width: '18%', fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  colDescVal:   { width: '32%', fontSize: 8, color: SLATE_600 },
  colFechaVal:  { width: '18%', fontSize: 8, color: SLATE_600, textAlign: 'center' },

  statusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },


  footer: {
    position: 'absolute', bottom: 26, left: 36, right: 36,
    fontSize: 7, color: SLATE_400, textAlign: 'center',
    borderTopWidth: 0.5, borderTopColor: SLATE_200, paddingTop: 8,
  },
  logo: { width: 60, height: 60, marginBottom: 6, objectFit: 'contain' },
});

const InventoryReport = ({ inventories = [], municipalityName = 'Municipalidad' }) => {
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
      <ReportPage logo={logo} title="Listado de Inventarios" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName={municipalityName}>
        {/* Meta */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Entidad</Text>
            <Text style={styles.metaValue}>{municipalityName}</Text>
            <Text style={[styles.metaLabel, { marginTop: 6 }]}>Oficina</Text>
            <Text style={styles.metaValue}>Gerencia Municipal</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Fecha de generación</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>
          </View>
        </View>

        {/* Tabla */}
        <View style={styles.tableHeader}>
          <Text style={styles.colNum}>N° Inventario</Text>
          <Text style={styles.colTipo}>Tipo</Text>
          <Text style={styles.colEstado}>Estado</Text>
          <Text style={styles.colDesc}>Descripción</Text>
          <Text style={styles.colFecha}>Inicio Plan.</Text>
        </View>

        {inventories.map((inv, idx) => {
          const status = normalizeStatus(inv.status || inv.inventoryStatus);
          return (
            <View key={inv.id || idx} style={[styles.tableRow, { backgroundColor: idx % 2 !== 0 ? ROW_ALT : '#ffffff' }]}>
              <Text style={styles.colNumVal}>{inv.inventoryNumber || '—'}</Text>
              <Text style={styles.colTipoVal}>{TYPE_LABELS[inv.inventoryType] || inv.inventoryType || '—'}</Text>
              <Text style={[styles.colEstadoVal, { color: (STATUS_COLORS[status] || {}).color || SLATE_600 }]}>
                {STATUS_LABELS[status] || '—'}
              </Text>
              <Text style={styles.colDescVal} numberOfLines={1}>{inv.description || '—'}</Text>
              <Text style={styles.colFechaVal}>{fmtDate(inv.plannedStartDate)}</Text>
            </View>
          );
        })}

        </ReportPage>
    </Document>
  );
};

export default InventoryReport;
