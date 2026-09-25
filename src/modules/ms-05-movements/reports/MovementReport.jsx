import React from 'react';
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage } from '../../../shared/reports';
import {
  buildAreasNameMap,
  buildMovementAssetReportLines,
  formatTextByWords,
  getAreaLabelForMovement,
  getDestinationResponsibleId,
  summarizeMovementAssets,
} from '../utils/movementReportHelpers';

const NAVY = '#1a365d';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_200 = '#e2e8f0';
const CYAN_600 = '#0891b2';

/** Sin guiones automáticos al partir palabras en @react-pdf/renderer */
const noHyphenation = (word) => [word];

const COL_WIDTHS = {
  mov: '8%',
  asset: '16%',
  type: '9%',
  date: '8%',
  status: '9%',
  area: '12%',
  responsible: '18%',
  reason: '20%',
};

const STATUS_STYLES = {
  COMPLETED: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  APPROVED: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  IN_PROCESS: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  REQUESTED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  PARTIAL: { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
};

const styles = StyleSheet.create({
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  table: { width: '100%', marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
    alignItems: 'stretch',
  },
  headerCell: {
    paddingVertical: 7,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCellLast: {
    paddingVertical: 7,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 6.5,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  bodyCell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  bodyCellLast: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  cellText: { fontSize: 6.5, color: SLATE_800, lineHeight: 1.4, textAlign: 'left' },
  cellTextBold: {
    fontSize: 6.5,
    color: SLATE_800,
    fontWeight: 'bold',
    lineHeight: 1.4,
    textAlign: 'left',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: { fontSize: 6, fontWeight: 'bold' },
});

const statusLabel = (status) => {
  const map = {
    REQUESTED: 'Solicitado',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    IN_PROCESS: 'En proceso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    PARTIAL: 'Parcial',
  };
  return map[status] || status || 'N/A';
};

const typeLabel = (type) => {
  const map = {
    INITIAL_ASSIGNMENT: 'Primera asignación',
    REASSIGNMENT: 'Reasignación',
    AREA_TRANSFER: 'Transf. entre áreas',
    EXTERNAL_TRANSFER: 'Transf. externa',
    RETURN: 'Devolución',
    LOAN: 'Préstamo',
    MAINTENANCE: 'Mantenimiento',
    REPAIR: 'Reparación',
    DISPOSAL: 'Baja',
  };
  return map[type] || type || 'N/A';
};

const HeaderCell = ({ width, label, last = false }) => (
  <View style={[{ width }, last ? styles.headerCellLast : styles.headerCell]}>
    <Text style={styles.headerText} hyphenationCallback={noHyphenation}>
      {label}
    </Text>
  </View>
);

const BodyCell = ({ width, children, last = false, bold = false }) => (
  <View style={[{ width }, last ? styles.bodyCellLast : styles.bodyCell]}>
    <Text
      style={bold ? styles.cellTextBold : styles.cellText}
      hyphenationCallback={noHyphenation}
    >
      {children || 'N/A'}
    </Text>
  </View>
);

const AssetsBodyCell = ({ width, lines = [] }) => (
  <View style={[{ width }, styles.bodyCell]}>
    {lines.map((line, index) => (
      <Text
        key={`${line.text}-${index}`}
        style={[styles.cellText, index > 0 ? { marginTop: 2 } : null]}
        hyphenationCallback={noHyphenation}
      >
        {line.text || 'N/A'}
      </Text>
    ))}
  </View>
);

const StatusCell = ({ width, status }) => {
  const sc = STATUS_STYLES[status] || STATUS_STYLES.REQUESTED;
  return (
    <View style={[{ width }, styles.bodyCell]}>
      <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
        <Text style={[styles.statusBadgeText, { color: sc.color }]} hyphenationCallback={noHyphenation}>
          {statusLabel(status)}
        </Text>
      </View>
    </View>
  );
};

export const MOVEMENT_LIST_REPORT_TITLE = 'Reporte General de Movimientos de Activos';

const MovementReport = ({
  movements,
  assetSearchData = {},
  areas = [],
  persons = [],
  municipalityLogo,
  municipalityName,
}) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const areasMap = buildAreasNameMap(areas);

  const personsMap = (() => {
    const map = {};
    (persons || []).forEach((person) => {
      if (!person) return;
      const id = person.id || person.personId;
      if (!id) return;
      const firstName = person.firstName || person.nombres || '';
      const lastName = person.lastName || person.apellidos || person.apellidoPaterno || '';
      const middleName = person.middleName || person.apellidoMaterno || '';
      let fullName = `${firstName} ${lastName} ${middleName}`.trim();
      if (!fullName) fullName = person.fullName || person.nombreCompleto || '';
      map[id] = fullName || '';
      map[String(id)] = fullName || '';
    });
    return map;
  })();

  const resolvePersonName = (personId) => {
    if (!personId) return null;
    return personsMap[personId] || personsMap[String(personId)] || null;
  };

  const getAreaForMovement = (movement) => {
    const label = getAreaLabelForMovement(movement, areasMap);
    if (label) return label;
    return 'Sin asignar';
  };

  const getResponsibleForMovement = (movement) => {
    const personId = getDestinationResponsibleId(movement);
    if (!personId) return 'Sin asignar';
    return resolvePersonName(personId) || 'Sin asignar';
  };

  const assetSummary = summarizeMovementAssets(movements);

  return (
    <Document title={MOVEMENT_LIST_REPORT_TITLE}>
      <ReportPage
        logo={municipalityLogo}
        title={MOVEMENT_LIST_REPORT_TITLE}
        subtitle="Listado nominal del sistema"
        muniName={municipalityName}
        orientation="landscape"
      >
        <View style={styles.metaSection}>
          <View>
            <Text style={styles.metaText}>Oficina: Gerencia Municipal</Text>
          </View>
          <View>
            <Text style={styles.reportTypeBadge}>LISTADO DE MOVIMIENTOS</Text>
            <Text style={[styles.metaText, { marginTop: 4 }]}>Generado: {dateStr}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <HeaderCell width={COL_WIDTHS.mov} label="N° Mov." />
            <HeaderCell width={COL_WIDTHS.asset} label="Bien(es)" />
            <HeaderCell width={COL_WIDTHS.type} label="Tipo" />
            <HeaderCell width={COL_WIDTHS.date} label="F. solicitud" />
            <HeaderCell width={COL_WIDTHS.status} label="Estado" />
            <HeaderCell width={COL_WIDTHS.area} label="Área actual" />
            <HeaderCell width={COL_WIDTHS.responsible} label="Responsable actual" />
            <HeaderCell width={COL_WIDTHS.reason} label="Motivo" last />
          </View>

          {movements.map((m, i) => {
            const assetLines = buildMovementAssetReportLines(m, assetSearchData);
            const currentArea = getAreaForMovement(m);
            const currentResponsible = getResponsibleForMovement(m);
            const requestDate = m.requestDate
              ? new Date(m.requestDate).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <View
                key={m.id}
                style={[
                  styles.tableRow,
                  { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' },
                ]}
              >
                <BodyCell width={COL_WIDTHS.mov} bold>
                  {m.movementNumber || 'N/A'}
                </BodyCell>
                <AssetsBodyCell width={COL_WIDTHS.asset} lines={assetLines} />
                <BodyCell width={COL_WIDTHS.type}>
                  {formatTextByWords(typeLabel(m.movementType), 16)}
                </BodyCell>
                <BodyCell width={COL_WIDTHS.date}>{requestDate}</BodyCell>
                <StatusCell width={COL_WIDTHS.status} status={m.movementStatus} />
                <BodyCell width={COL_WIDTHS.area}>
                  {formatTextByWords(currentArea, 20)}
                </BodyCell>
                <BodyCell width={COL_WIDTHS.responsible}>
                  {formatTextByWords(currentResponsible, 28)}
                </BodyCell>
                <BodyCell width={COL_WIDTHS.reason} last>
                  {formatTextByWords(m.reason || 'N/A', 38)}
                </BodyCell>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 16, padding: 10, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
          <Text style={{ fontSize: 8, color: SLATE_800, fontWeight: 'bold', marginBottom: 4 }}>
            Total: {assetSummary.movements} movimientos
            {assetSummary.assetLines > 0 && ` · ${assetSummary.assetLines} bienes · ${assetSummary.units} unidades`}.
            {'  '}Completados: {movements.filter((m) => m.movementStatus === 'COMPLETED').length}
            {'  '}En proceso: {movements.filter((m) => m.movementStatus === 'IN_PROCESS').length}
            {'  '}Solicitados: {movements.filter((m) => m.movementStatus === 'REQUESTED').length}
          </Text>
          <Text style={{ fontSize: 7, color: SLATE_600, fontStyle: 'italic' }}>
            Un movimiento (acta) puede incluir varios bienes numerados en la columna Bien(es). Área y responsable actual = destino del movimiento.
          </Text>
        </View>
      </ReportPage>
    </Document>
  );
};

export default MovementReport;
