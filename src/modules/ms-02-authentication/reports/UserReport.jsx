import React from 'react';
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage } from '../../../shared/reports';

const NAVY = '#1a365d';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const CYAN_600 = '#0891b2';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: NAVY,
    margin: -30,
    marginBottom: 30,
    padding: 30,
    paddingBottom: 20,
    flexDirection: 'column',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 9,
    marginTop: 4,
  },
  // Información de la municipalidad/reporte
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: SLATE_200,
    paddingBottom: 10,
  },
  metaText: {
    fontSize: 8,
    color: SLATE_600,
  },
  reportTypeBadge: {
    backgroundColor: '#f1f5f9',
    padding: '4 10',
    borderRadius: 4,
    color: CYAN_600,
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Tabla
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    minHeight: 30,
    alignItems: 'center',
  },
  tableColHeader: {
    padding: 6,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 6,
    fontSize: 8,
    color: SLATE_800,
  },
  statusBadge: {
    padding: '2 6',
    borderRadius: 4,
    fontSize: 7,
    textAlign: 'center',
    width: 60,
  },
  // Firmas (Estilo Municipalidad)
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: SLATE_800,
    paddingTop: 5,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: SLATE_800,
    fontWeight: 'bold',
  },
});

const UserReport = ({ users, persons, areas, positions, municipalityLogo, municipalityName }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const getPersonName = (personId) => {
    const p = persons[personId];
    return p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'N/A';
  };

  const getAreaName = (areaId) => {
    if (areaId === undefined || areaId === null) return '—';
    const area = areas.find(a => a.id === areaId || String(a.id) === String(areaId) || a._id === areaId);
    return area ? (area.name || area.nombre || area.areaName || '—') : '—';
  };

  const getPositionName = (positionId) => {
    if (positionId === undefined || positionId === null) return '—';
    const pos = positions.find(p => p.id === positionId || String(p.id) === String(positionId) || p._id === positionId);
    return pos ? (pos.name || pos.nombre || pos.positionName || '—') : '—';
  };

  return (
    <Document>
      <ReportPage logo={municipalityLogo} title="Reporte General de Usuarios" subtitle="Listado nominal del sistema" muniName={municipalityName}>

        {/* Metadatos */}
        <View style={styles.metaSection}>
          <View>
            <Text style={styles.metaText}>Oficina: Gerencia Municipal</Text>
          </View>
          <View style={{ alignItems: 'flex-right' }}>
            <Text style={styles.reportTypeBadge}>LISTADO NOMINAL</Text>
            <Text style={[styles.metaText, { marginTop: 4 }]}>Generado: {dateStr}</Text>
          </View>
        </View>

        {/* Tabla de Usuarios */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={{ width: '20%' }}><Text style={styles.tableColHeader}>Usuario</Text></View>
            <View style={{ width: '30%' }}><Text style={styles.tableColHeader}>Nombre y Apellidos</Text></View>
            <View style={{ width: '20%' }}><Text style={styles.tableColHeader}>Área / Oficina</Text></View>
            <View style={{ width: '20%' }}><Text style={styles.tableColHeader}>Cargo</Text></View>
          </View>

          {users.map((user, i) => (
            <View key={user.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
              <View style={{ width: '20%' }}><Text style={styles.tableCol}>{user.username}</Text></View>
              <View style={{ width: '30%' }}><Text style={styles.tableCol}>{getPersonName(user.personId)}</Text></View>
              <View style={{ width: '20%' }}><Text style={styles.tableCol}>{getAreaName(user.areaId)}</Text></View>
              <View style={{ width: '20%' }}><Text style={styles.tableCol}>{getPositionName(user.positionId)}</Text></View>
            </View>
          ))}
        </View>

        {/* Sección de Firmas (Gubernamental) */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
            <Text style={{ fontSize: 7, color: SLATE_600 }}>SIPREB - {municipalityName || 'San Luis'}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Jefe de Área</Text>
            <Text style={{ fontSize: 7, color: SLATE_600 }}>Administración Municipal</Text>
          </View>
        </View>

      </ReportPage>
    </Document>
  );
};

export default UserReport;
