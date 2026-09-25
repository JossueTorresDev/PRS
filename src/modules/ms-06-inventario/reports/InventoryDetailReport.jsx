import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';

const NAVY      = '#1a365d';
const BLUE      = '#1d4ed8';
const TEAL      = '#0f766e';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const ROW_ALT   = '#f1f5f9';
const WHITE     = '#ffffff';
const BLACK     = '#000000';

const FOUND_LABELS = {
  FOUND:   'Encontrado',
  MISSING: 'Faltante',
  SURPLUS: 'Sobrante',
  DAMAGED: 'Dañado',
};

const FOUND_COLORS = {
  FOUND:   { bg: '#dcfce7', color: '#065f46' },
  MISSING: { bg: '#fee2e2', color: '#b91c1c' },
  SURPLUS: { bg: '#fef9c3', color: '#92400e' },
  DAMAGED: { bg: '#ffedd5', color: '#9a3412' },
};

const normalizeStatus = (s) => {
  if (!s) return 'PLANNED';
  const n = String(s).toUpperCase().trim().replace(/\s+/g, '_');
  return n === 'IN_PROCESS' ? 'IN_PROGRESS' : n;
};

const getUserName = (id, users = []) => {
  if (!id) return '—';
  const user = users.find(u => u.id === id);
  if (!user) return '—';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim()
    || user.fullName
    || user.nombre
    || user.name
    || user.username
    || user.personalEmail
    || '—';
};

const getAssetInfo = (assetId, assets = []) => {
  const asset = assets.find(a => a.id === assetId);
  const code = asset?.assetCode || asset?.codigoPatrimonial || (assetId ? assetId.slice(-8) : 'Sin asignar');
  const description = asset?.description || asset?.descripcion || 'Sin descripción';
  return { code, description };
};

const styles = StyleSheet.create({
  page: { 
    padding: 15, 
    backgroundColor: WHITE, 
    fontFamily: 'Helvetica',
    fontSize: 9
  },

  // ── HEADER OFICIAL ──────────────────────────────────────────────────────
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#d4a574',
    backgroundColor: '#1a3a52',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  headerLeft: {
    flex: 1,
  },

  headerCenter: {
    flex: 2,
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },

  logo: { width: 72, height: 72, marginBottom: 6, objectFit: 'contain' },

  municipalityName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: WHITE,
    marginBottom: 2,
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  reportSubtitle: {
    fontSize: 8,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 1,
    fontStyle: 'italic',
  },

  captureNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: WHITE,
    backgroundColor: '#2d5a7b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },

  // ── INFORMACIÓN GENERAL ─────────────────────────────────────────────────
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },

  infoColumn: {
    flex: 1,
    fontSize: 8,
  },

  infoLabel: {
    fontWeight: 'bold',
    color: BLACK,
    marginBottom: 1,
  },

  infoValue: {
    color: SLATE_800,
    marginBottom: 3,
  },

  // ── TABLA DE BIENES ─────────────────────────────────────────────────────
  tableContainer: {
    marginTop: 10,
    marginBottom: 20,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a3a52',
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 7,
    paddingVertical: 5,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#1a3a52',
  },

  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d4a574',
    minHeight: 22,
    fontSize: 7,
  },

  tableCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    borderRightWidth: 1,
    borderRightColor: '#d4a574',
  },

  tableCellLast: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    borderRightWidth: 0,
  },

  // Anchos de columna optimizados para layout horizontal (suman 100%)
  colNo: { width: '2%' },
  colPatrimonial: { width: '7%' },
  colCode: { width: '20%' },
  colDescription: { width: '11%' },
  colMarca: { width: '5%' },
  colModelo: { width: '5%' },
  colColor: { width: '4%' },
  colSerie: { width: '6%' },
  colDimensions: { width: '6%' },
  colLocation: { width: '7%' },
  colState: { width: '3%' },
  colConservation: { width: '3%' },
  colObservations: { width: '16%' },
  colDifFisicas: { width: '8%' },
  colDifDocumentales: { width: '8%' },

  // ── LEYENDA Y FIRMAS ────────────────────────────────────────────────────
  legendContainer: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 7,
    color: SLATE_600,
  },

  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },

  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: SLATE_200,
  },

  signatureBox: {
    flex: 1,
    alignItems: 'center',
    fontSize: 8,
    paddingHorizontal: 6,
  },

  signatureLine: {
    width: 140,
    borderTopWidth: 1,
    borderTopColor: BLACK,
    marginBottom: 6,
    marginTop: 12,
  },

  signatureLabel: {
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },

  signatureDniBox: {
    width: 100,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    marginTop: 6,
    height: 10,
  },

  footer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    fontSize: 7,
    color: SLATE_400,
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: SLATE_200,
    paddingTop: 5,
  },
});

const Field = ({ label, value, shade }) => (
  <View style={[styles.fieldRow, { backgroundColor: shade ? ROW_ALT : '#ffffff' }]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
  </View>
);

const InventoryDetailReport = ({ inventory, extraNames = {}, municipalityName = 'Municipalidad', details = [], assets = [], locations = [] }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
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

  const { locationName, responsibleName, detailLocationName, detailResponsibleName } = extraNames;

  const getAsset = (assetId) => assets.find(a => a.id === assetId);
  const getLocationName = (locationId, displayName) => {
    // Si tenemos displayName, usarlo
    if (displayName) return displayName;
    if (!locationId) return '—';
    // Si locations tiene datos, buscar en él
    if (locations && locations.length > 0) {
      const location = locations.find(l => l.id === locationId);
      if (location) return location.name;
    }
    // Si no encuentra nada, devolver —
    return '—';
  };

  return (
    <Document>
      <ReportPage logo={logo} title="FICHA DE ASIGNACIÓN DE BIENES EN USO" subtitle="INVENTARIO DE BIENES PATRIMONIALES 2026" muniName={municipalityName} size="A4" orientation="landscape">

        <View style={{ position: 'absolute', top: 20, right: 24 }}>
          <Text style={styles.captureNumber}>CAPTURA No: {inventory?.inventoryNumber || '000000'}</Text>
        </View>
        {/* INFORMACIÓN GENERAL */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>NÚMERO DE INVENTARIO</Text>
            <Text style={styles.infoValue}>{inventory?.inventoryNumber || '—'}</Text>
            <Text style={styles.infoLabel}>TIPO DE INVENTARIO</Text>
            <Text style={styles.infoValue}>{inventory?.inventoryType || '—'}</Text>
            <Text style={styles.infoLabel}>DESCRIPCIÓN</Text>
            <Text style={styles.infoValue}>{inventory?.description || '—'}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>RESPONSABLE GENERAL</Text>
            <Text style={styles.infoValue}>{responsibleName || 'NO ASIGNADO'}</Text>
            <Text style={styles.infoLabel}>FECHA INICIO PLANIFICADA</Text>
            <Text style={styles.infoValue}>
              {inventory?.plannedStartDate ? (() => {
                const date = new Date(inventory.plannedStartDate);
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                return `${day}/${month}/${year}`;
              })() : '—'}
            </Text>
            <Text style={styles.infoLabel}>FECHA FIN PLANIFICADA</Text>
            <Text style={styles.infoValue}>
              {inventory?.plannedEndDate ? (() => {
                const date = new Date(inventory.plannedEndDate);
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                return `${day}/${month}/${year}`;
              })() : '—'}
            </Text>
          </View>
        </View>

        {/* TABLA DE BIENES */}
        {details.length > 0 && (
          <View style={styles.tableContainer}>
            {/* Cabecera */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.colNo]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>No</Text>
              </View>
              <View style={[styles.tableCell, styles.colPatrimonial]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>CÓDIGO</Text>
              </View>
              <View style={[styles.tableCell, styles.colCode]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>DENOMINACIÓN</Text>
              </View>
              <View style={[styles.tableCell, styles.colMarca]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>MARCA</Text>
              </View>
              <View style={[styles.tableCell, styles.colModelo]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>MODELO</Text>
              </View>
              <View style={[styles.tableCell, styles.colColor]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>COLOR</Text>
              </View>
              <View style={[styles.tableCell, styles.colSerie]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>SERIE</Text>
              </View>
              <View style={[styles.tableCell, styles.colDimensions]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>DIMENSIONES</Text>
              </View>
              <View style={[styles.tableCell, styles.colLocation]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>UBICACIÓN</Text>
              </View>
              <View style={[styles.tableCell, styles.colState]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>EST.</Text>
              </View>
              <View style={[styles.tableCell, styles.colConservation]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>CONS.</Text>
              </View>
              <View style={[styles.tableCell, styles.colObservations]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>OBS.</Text>
              </View>
              <View style={[styles.tableCell, styles.colDifFisicas]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>D.F.</Text>
              </View>
              <View style={[styles.tableCellLast, styles.colDifDocumentales]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 6 }}>D.D.</Text>
              </View>
            </View>

            {/* Filas de datos */}
            {details.map((detail, index) => {
              // Buscar en assets, si no encuentra, usar fallback
              let asset = assets?.find(a => a.id === detail.assetId);
              
              // Si no hay asset en el array, intentar obtener del detail
              const code = detail?.assetCode || detail?.codigoPatrimonial || asset?.assetCode || asset?.codigoPatrimonial || (detail.assetId ? detail.assetId.slice(-8) : '—');
              const desc = asset?.description || asset?.descripcion || detail?.description || detail?.denominacion || '—';
              const marca = asset?.brand || asset?.marca || '—';
              const modelo = asset?.model || asset?.modelo || '—';
              const color = asset?.color || '—';
              const serie = asset?.serialNumber || asset?.serie || '—';
              const dimensions = asset?.dimensions || asset?.dimensiones || '—';
              
              // Ubicación actual - usar _displayLocationName si está disponible
              const actualLocation = getLocationName(detail.actualLocationId, detail._displayLocationName);
              
              // Estado del bien (solo inicial)
              const foundStatusMap = {
                'FOUND': 'E',
                'MISSING': 'F',
                'SURPLUS': 'S',
                'DAMAGED': 'D'
              };
              const estadoBien = foundStatusMap[detail.foundStatus] || detail.foundStatus?.charAt(0) || '—';
              
              // Estado de conservación (solo inicial)
              const conservationMap = {
                'EXCELLENT': 'Ex',
                'GOOD': 'B',
                'REGULAR': 'R',
                'BAD': 'M',
                'UNUSABLE': 'I'
              };
              const conservacion = conservationMap[detail.actualConservationStatus] || detail.actualConservationStatus?.charAt(0) || '—';
              
              // Responsable actual
              const responsable = detail.actualResponsibleId ? getUserName(detail.actualResponsibleId, []) : '—';
              
              // Observaciones
              const obs = detail.observations || '—';
              const difFisicas = detail.physicalDifferences || '—';
              const difDocumentales = detail.documentDifferences || '—';
              
              const bgColor = index % 2 === 0 ? WHITE : ROW_ALT;

              return (
                <View key={detail.id || index} style={[styles.tableRow, { backgroundColor: bgColor }]}>
                  <View style={[styles.tableCell, styles.colNo]}>
                    <Text>{index + 1}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colPatrimonial]}>
                    <Text>{code}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colCode]}>
                    <Text>{desc}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colMarca]}>
                    <Text>{marca}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colModelo]}>
                    <Text>{modelo}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colColor]}>
                    <Text>{color}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colSerie]}>
                    <Text>{serie}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colDimensions]}>
                    <Text>{dimensions}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colLocation]}>
                    <Text>{actualLocation}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colState]}>
                    <Text>{estadoBien}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colConservation]}>
                    <Text>{conservacion}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colObservations]}>
                    <Text>{obs}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colDifFisicas]}>
                    <Text>{difFisicas}</Text>
                  </View>
                  <View style={[styles.tableCellLast, styles.colDifDocumentales]}>
                    <Text>{difDocumentales}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* LEYENDA */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>LEYENDA:</Text>
          <Text>(1) ESTADO DEL BIEN: E=Encontrado, F=Faltante, S=Sobrante, D=Dañado (2) CONSERVACIÓN: Ex=Excelente, B=Bueno, R=Regular, M=Malo, I=Inutilizable (3) D.F.=Diferencias Físicas, D.D.=Diferencias Documentales</Text>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Usuario: {responsibleName || 'NO ASIGNADO'}</Text>
            <Text>DNI:</Text>
            <View style={styles.signatureDniBox} />
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Inventariador</Text>
            <Text>DNI:</Text>
            <View style={styles.signatureDniBox} />
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Supervisor del Inventario</Text>
            <Text>DNI:</Text>
            <View style={styles.signatureDniBox} />
          </View>
        </View>

        {/* Footer provided by ReportPage (ReportFooter) - avoid duplicate manual footer */}
      </ReportPage>
    </Document>
  );
};

export default InventoryDetailReport;
