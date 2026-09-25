import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage } from '../../../shared/reports';
import {
  buildLookupMap,
  resolveFromLookup,
  getAreaLabelForMovement,
} from '../utils/movementReportHelpers';

// Paleta institucional - Normas de presentación sector público peruano
const NAVY = '#0f2744';
const NAVY_MID = '#1a3a5c';
const ACCENT = '#1a56db';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const EMERALD = '#059669';
const RED = '#dc2626';
const GOLD = '#b8860b';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 50,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  // Meta section
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottom: 1,
    borderBottomColor: SLATE_200,
    paddingBottom: 10,
  },
  metaText: {
    fontSize: 8,
    color: SLATE_600,
    marginBottom: 3,
  },
  metaLeft: {
    flexDirection: 'column',
    gap: 3,
  },
  metaRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  assetNameBadge: {
    backgroundColor: '#f1f5f9',
    padding: '6 12',
    borderRadius: 4,
    color: '#0891b2',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  codeText: {
    fontSize: 7,
    color: SLATE_400,
    marginTop: 1,
  },
  // Información del bien
  assetInfoSection: {
    backgroundColor: SLATE_100,
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderStyle: 'solid',
  },
  assetInfoTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: NAVY,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  assetInfoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  assetInfoLabel: {
    fontSize: 7,
    color: SLATE_600,
    fontWeight: 'bold',
    width: '25%',
  },
  assetInfoValue: {
    fontSize: 7,
    color: SLATE_800,
    flex: 1,
    lineHeight: 1.4,
  },
  // Título de sección
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: NAVY_MID,
    padding: '6 10',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  // Resumen estadístico - Estilo Dashboard compacto
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 0,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  summaryCardLast: {
    borderRightWidth: 0,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 2,
  },
  summaryValueSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ACCENT,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 6,
    color: SLATE_600,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // Nota explicativa
  summaryNote: {
    backgroundColor: '#f8fafc',
    padding: 8,
    marginBottom: 10,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    borderLeftStyle: 'solid',
  },
  summaryNoteText: {
    fontSize: 7,
    color: SLATE_600,
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  // Tabla
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 6.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    minHeight: 26,
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 7,
    color: SLATE_800,
    padding: 5,
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  // Columnas específicas - Ajustadas para evitar división de encabezados
  colNum: { width: '3%' },
  colFecha: { width: '8%' },
  colTipo: { width: '13%' },
  colCustodioAnt: { width: '15%' },
  colCustodioNuevo: { width: '15%' },
  colArea: { width: '15%' },
  colTiempo: { width: '10%' },
  colActa: { width: '10%' },
  colAprobador: { width: '11%' },
  // Badge para custodio actual - Mejorado
  custodioActualContainer: {
    flexDirection: 'column',
  },
  custodioNombre: {
    fontSize: 7,
    color: SLATE_800,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  badgeCurrent: {
    backgroundColor: '#dcfce7',
    color: EMERALD,
    fontSize: 5.5,
    fontWeight: 'bold',
    padding: '2 4',
    borderRadius: 2,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  // Notas importantes
  notesSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    borderLeftStyle: 'solid',
    borderRadius: 3,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 7,
    color: SLATE_600,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  // Estado vacío
  emptyState: {
    textAlign: 'center',
    padding: 30,
    backgroundColor: SLATE_100,
    borderRadius: 4,
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: SLATE_600,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 7,
    color: SLATE_400,
  },
});

const MovementTypeLabels = {
  INITIAL_ASSIGNMENT: 'Primera Asignación',
  REASSIGNMENT: 'Reasignación',
  AREA_TRANSFER: 'Transf. entre Áreas',
  EXTERNAL_TRANSFER: 'Transf. Externa',
  RETURN: 'Devolución',
  LOAN: 'Préstamo Temporal',
  MAINTENANCE: 'Mantenimiento',
  REPAIR: 'Reparación',
  DISPOSAL: 'Baja',
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateDuration = (startDate, endDate) => {
  if (!startDate) return '—';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffMs = end - start;
  
  if (diffMs <= 0) return '—';
  
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (dias === 0) return '< 1 día';
  if (dias === 1) return '1 día';
  if (dias < 30) return `${dias} días`;
  
  const meses = Math.floor(dias / 30);
  const diasRestantes = dias % 30;
  
  if (meses === 1) {
    return diasRestantes > 0 ? `1 mes ${diasRestantes}d` : '1 mes';
  }
  
  return diasRestantes > 0 ? `${meses} meses ${diasRestantes}d` : `${meses} meses`;
};

const truncate = (text, maxLength = 30) => {
  if (!text) return '—';
  const str = String(text);
  return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
};

export const ASSET_HISTORY_REPORT_BASE_TITLE = 'Historial del Bien Patrimonial';

export const buildAssetHistoryReportTitle = (assetName) => {
  const name = String(assetName || '').trim();
  return name
    ? `${ASSET_HISTORY_REPORT_BASE_TITLE} - ${name}`
    : `${ASSET_HISTORY_REPORT_BASE_TITLE} - Cadena de Custodia`;
};

const AssetHistoryReport = ({
  assetName,
  assetCode,
  assetId,
  movements = [],
  persons = {},
  users = {},
  areas = {},
  locations: _locations = {},
  municipalityLogo,
  municipalityName = '',
  officeName = 'Gerencia Municipal',
}) => {
  const now = new Date();
  
  // Filtrar solo movimientos completados y ordenar cronológicamente (más reciente primero)
  const completedMovements = movements
    .filter(m => m.movementStatus === 'COMPLETED')
    .sort((a, b) => {
      const dateA = new Date(a.approvalDate || a.executionDate || a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.approvalDate || b.executionDate || b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

  const totalMovements = completedMovements.length;

  const personsMap = buildLookupMap(persons);
  const usersMap = buildLookupMap(users);
  const areasMap = buildLookupMap(areas);

  const labelOrDash = (name) => (name ? truncate(name, 25) : '—');

  // Preparar datos de la tabla
  const cronologico = [...completedMovements].reverse();
  const tableData = completedMovements.map((mov, idx) => {
    const fechaEfectiva = mov.approvalDate || mov.executionDate || mov.updatedAt;
    const custodioAnterior = labelOrDash(
      resolveFromLookup(mov.originResponsibleId, personsMap, usersMap)
    );
    const custodioNuevo = labelOrDash(
      resolveFromLookup(mov.destinationResponsibleId, personsMap, usersMap)
    );
    const aprobadoPor = truncate(
      resolveFromLookup(mov.approvedBy, usersMap, personsMap) || '—',
      18
    );
    const areaDestino = truncate(
      getAreaLabelForMovement(mov, areasMap)
        || resolveFromLookup(mov.destinationAreaId, areasMap)
        || '—',
      22
    );
    const acta = mov.supportingDocumentNumber || mov.movementNumber || '—';
    
    // Calcular tiempo en custodia
    const cronIdx = cronologico.findIndex(m => m.id === mov.id);
    const movSiguiente = cronologico[cronIdx + 1] || null;
    
    const startDate = fechaEfectiva;
    const endDate = movSiguiente 
      ? (movSiguiente.approvalDate || movSiguiente.executionDate || movSiguiente.updatedAt)
      : null;
    
    const tiempoCustodia = calculateDuration(startDate, endDate);
    const esUltimo = idx === 0;

    return {
      num: completedMovements.length - idx,
      fecha: formatDate(fechaEfectiva),
      tipo: MovementTypeLabels[mov.movementType] || mov.movementType,
      custodioAnterior,
      custodioNuevo,
      area: areaDestino,
      tiempo: tiempoCustodia,
      acta: truncate(acta, 15),
      aprobador: aprobadoPor,
      esUltimo,
    };
  });

  const reportTitle = buildAssetHistoryReportTitle(assetName);

  return (
    <Document title={reportTitle}>
      <ReportPage
        logo={municipalityLogo}
        title={`${ASSET_HISTORY_REPORT_BASE_TITLE} - Cadena de Custodia`}
        subtitle="Listado nominal del sistema"
        muniName={municipalityName}
        orientation="landscape"
      >
        <View style={styles.metaSection}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaText}>Oficina: {officeName}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.assetNameBadge}>
              {assetName || 'N/A'}
            </Text>
            <Text style={styles.codeText}>Código: {assetCode || assetId || 'N/A'}</Text>
            <Text style={[styles.metaText, { marginTop: 4 }]}>
              Generado: {formatDateTime(now)}
            </Text>
          </View>
        </View>

        {/* Información del bien - Compacta */}
        <View style={styles.assetInfoSection}>
          <Text style={styles.assetInfoTitle}>I. INFORMACIÓN DEL BIEN</Text>
          <View style={styles.assetInfoRow}>
            <Text style={styles.assetInfoLabel}>Descripción:</Text>
            <Text style={styles.assetInfoValue}>{assetName || 'N/A'}</Text>
          </View>
          <View style={styles.assetInfoRow}>
            <Text style={styles.assetInfoLabel}>Normativa:</Text>
            <Text style={styles.assetInfoValue}>
              Directiva N° 001-2015/SBN - Superintendencia Nacional de Bienes Estatales
            </Text>
          </View>
        </View>

        {/* Resumen estadístico eliminado */}

        {/* Título de tabla */}
        <Text style={styles.sectionTitle}>
          II. CADENA DE CUSTODIA - REGISTRO DE MOVIMIENTOS COMPLETADOS
        </Text>

        {/* Tabla de movimientos */}
        {completedMovements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Sin Movimientos Registrados</Text>
            <Text style={styles.emptyText}>
              No hay movimientos completados para este bien patrimonial
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Encabezado de tabla */}
            <View style={styles.tableHeader}>
              <View style={styles.colNum}><Text style={styles.tableHeaderCell}>#</Text></View>
              <View style={styles.colFecha}><Text style={styles.tableHeaderCell}>FECHA</Text></View>
              <View style={styles.colTipo}><Text style={styles.tableHeaderCell}>TIPO MOVIMIENTO</Text></View>
              <View style={styles.colCustodioAnt}><Text style={styles.tableHeaderCell}>CUSTODIO ANTERIOR</Text></View>
              <View style={styles.colCustodioNuevo}><Text style={styles.tableHeaderCell}>NUEVO CUSTODIO</Text></View>
              <View style={styles.colArea}><Text style={styles.tableHeaderCell}>ÁREA DESTINO</Text></View>
              <View style={styles.colTiempo}><Text style={styles.tableHeaderCell}>TIEMPO CUSTODIA</Text></View>
              <View style={styles.colActa}><Text style={styles.tableHeaderCell}>N° ACTA</Text></View>
              <View style={styles.colAprobador}><Text style={styles.tableHeaderCell}>APROBADO POR</Text></View>
            </View>

            {/* Filas de datos */}
            {tableData.map((row, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.tableRow, 
                  idx % 2 === 1 && styles.tableRowAlt
                ]}
                wrap={false}
              >
                <View style={styles.colNum}>
                  <Text style={[styles.tableCell, styles.tableCellBold]}>{row.num}</Text>
                </View>
                <View style={styles.colFecha}>
                  <Text style={styles.tableCell}>{row.fecha}</Text>
                </View>
                <View style={styles.colTipo}>
                  <Text style={styles.tableCell}>{row.tipo}</Text>
                </View>
                <View style={styles.colCustodioAnt}>
                  <Text style={styles.tableCell}>{row.custodioAnterior}</Text>
                </View>
                <View style={styles.colCustodioNuevo}>
                  {row.esUltimo ? (
                    <View style={styles.custodioActualContainer}>
                      <Text style={styles.custodioNombre}>{row.custodioNuevo}</Text>
                      <Text style={styles.badgeCurrent}>ACTUAL</Text>
                    </View>
                  ) : (
                    <Text style={[styles.tableCell, styles.tableCellBold]}>{row.custodioNuevo}</Text>
                  )}
                </View>
                <View style={styles.colArea}>
                  <Text style={styles.tableCell}>{row.area}</Text>
                </View>
                <View style={styles.colTiempo}>
                  <Text style={styles.tableCell}>{row.tiempo}</Text>
                </View>
                <View style={styles.colActa}>
                  <Text style={styles.tableCell}>{row.acta}</Text>
                </View>
                <View style={styles.colAprobador}>
                  <Text style={styles.tableCell}>{row.aprobador}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notas importantes */}
        {totalMovements > 0 && (
          <View style={styles.notesSection} wrap={false}>
            <Text style={styles.notesTitle}>Notas Importantes:</Text>
            <Text style={styles.notesText}>
              • Este reporte muestra únicamente los movimientos con estado COMPLETADO, conforme a la normativa de la SBN.
            </Text>
            <Text style={styles.notesText}>
              • El custodio marcado como "ACTUAL" es el responsable vigente del bien patrimonial.
            </Text>
            <Text style={styles.notesText}>
              • El tiempo de custodia se calcula desde la fecha de aprobación/ejecución hasta el siguiente movimiento o la fecha actual.
            </Text>
            <Text style={styles.notesText}>
              • Cada movimiento debe contar con su respectiva acta de entrega-recepción según normativa vigente.
            </Text>
          </View>
        )}

      </ReportPage>
    </Document>
  );
};

export default AssetHistoryReport;
