import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage } from '../../../shared/reports';
import { resolveMovementAssetItems } from '../utils/movementReportHelpers';

const NAVY = '#1a365d';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_200 = '#e2e8f0';
const EMPTY = '—';

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 20, borderBottomWidth: 1, borderBottomColor: SLATE_200, borderBottomStyle: 'solid', paddingBottom: 10,
  },
  metaText: { fontSize: 8, color: SLATE_600 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 10, fontWeight: 'bold', color: '#ffffff',
    backgroundColor: NAVY, padding: '6 12', borderRadius: 3, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  // Estilos para tabla
  table: {
    borderWidth: 1,
    borderColor: SLATE_200,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableCell: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: SLATE_200,
  },
  tableCellLast: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCellContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tableCellLabel: {
    fontSize: 9,
    color: SLATE_800,
    fontWeight: 'bold',
    marginRight: 4,
    textAlign: 'left',
  },
  tableCellValue: {
    fontSize: 9,
    color: SLATE_600,
    flex: 1,
    textAlign: 'left',
    lineHeight: 1.35,
  },
  assetTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  assetTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  assetTableRowLast: {
    flexDirection: 'row',
  },
  assetColNum: {
    width: '8%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: SLATE_200,
    fontSize: 9,
    color: SLATE_600,
    textAlign: 'center',
  },
  assetColName: {
    width: '72%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: SLATE_200,
    fontSize: 9,
    color: SLATE_800,
  },
  assetColQty: {
    width: '20%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    color: SLATE_600,
    textAlign: 'center',
  },
  assetHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: SLATE_800,
    textTransform: 'uppercase',
  },
  assetSummary: {
    fontSize: 8,
    color: SLATE_600,
    marginTop: 4,
    textAlign: 'right',
  },
  statusBadge: {
    padding: '4 10',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 8,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
});

/** Misma paleta que badges UI (bg-blue-50 / text-blue-700 / border-blue-200). */
const statusColors = {
  COMPLETED: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  APPROVED: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  IN_PROCESS: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  REQUESTED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  CANCELLED: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  PARTIAL: { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
};

const statusLabel = (s) => ({ REQUESTED: 'Solicitado', APPROVED: 'Aprobado', REJECTED: 'Rechazado', IN_PROCESS: 'En Proceso', COMPLETED: 'Completado', CANCELLED: 'Cancelado', PARTIAL: 'Parcial' }[s] || s || EMPTY);
const typeLabel = (t) => ({ INITIAL_ASSIGNMENT: 'Primera Asignación', REASSIGNMENT: 'Reasignación', AREA_TRANSFER: 'Transferencia entre Áreas', EXTERNAL_TRANSFER: 'Transferencia Externa', RETURN: 'Devolución', LOAN: 'Préstamo Temporal', MAINTENANCE: 'Mantenimiento', REPAIR: 'Reparación', DISPOSAL: 'Baja' }[t] || t || EMPTY);

const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const pickField = (obj, ...keys) => {
  for (const key of keys) {
    const v = obj?.[key];
    if (v != null && v !== '') return v;
  }
  return null;
};

const fmtOptionalDate = (movement, ...keysAndOptions) => {
  let pendingWhenEmpty = true;
  let keys = keysAndOptions;

  const lastArg = keysAndOptions[keysAndOptions.length - 1];
  if (
    lastArg
    && typeof lastArg === 'object'
    && !Array.isArray(lastArg)
    && Object.prototype.hasOwnProperty.call(lastArg, 'pendingWhenEmpty')
  ) {
    pendingWhenEmpty = lastArg.pendingWhenEmpty;
    keys = keysAndOptions.slice(0, -1);
  }

  const raw = pickField(movement, ...keys);
  const formatted = fmtDate(raw);
  if (formatted) return formatted;
  if (pendingWhenEmpty && movement?.movementStatus === 'REQUESTED') return 'Pendiente';
  return EMPTY;
};

const showValue = (value) =>
  value != null && value !== '' ? String(value) : EMPTY;

const TableRow = ({ label1, value1, label2, value2, isLast = false }) => (
  <View style={isLast ? styles.tableRowLast : styles.tableRow}>
    <View style={styles.tableCell}>
      <View style={styles.tableCellContent}>
        <Text style={styles.tableCellLabel}>{label1}</Text>
        <Text style={styles.tableCellValue}>{showValue(value1)}</Text>
      </View>
    </View>
    <View style={styles.tableCellLast}>
      <View style={styles.tableCellContent}>
        <Text style={styles.tableCellLabel}>{label2}</Text>
        <Text style={styles.tableCellValue}>{showValue(value2)}</Text>
      </View>
    </View>
  </View>
);

const TableRowFull = ({ label, value, isLast = false }) => (
  <View style={isLast ? styles.tableRowLast : styles.tableRow}>
    <View style={[styles.tableCell, { width: '100%', borderRightWidth: 0 }]}>
      <View style={styles.tableCellContent}>
        <Text style={styles.tableCellLabel}>{label}</Text>
        <Text style={styles.tableCellValue}>{showValue(value)}</Text>
      </View>
    </View>
  </View>
);

const MovementDetailReport = ({
  movement,
  persons = [],
  users = [],
  areas = [],
  locations = [],
  assetName,
  assetNamesById = {},
  municipalityLogo,
  municipalityName,
}) => {
  const now = new Date();
  const sc = statusColors[movement?.movementStatus] || statusColors.REQUESTED;

  const assetRows = resolveMovementAssetItems(movement).map((item, index) => ({
    line: item.lineNumber || index + 1,
    name: assetNamesById[item.assetId] || (index === 0 ? assetName : null) || item.assetId,
    quantity: item.quantity || 1,
  }));
  const totalUnits = assetRows.reduce((sum, row) => sum + row.quantity, 0);

  // Convertir arrays a mapas para búsqueda rápida (sin hooks)
  const personsMap = (() => {
    if (!persons || !Array.isArray(persons)) return {};
    const map = {};
    persons.forEach(person => {
      if (!person) return;
      const id = person.id || person.personId;
      if (!id) return;
      
      // Intentar múltiples campos para nombre
      const firstName = person.firstName || person.nombres || person.name || person.nombre || '';
      const lastName = person.lastName || person.apellidos || person.apellidoPaterno || person.apellido || '';
      const middleName = person.middleName || person.apellidoMaterno || '';
      
      let fullName = `${firstName} ${lastName} ${middleName}`.trim();
      if (!fullName) fullName = person.fullName || person.nombreCompleto || '';
      
      map[id] = fullName || 'Sin nombre';
    });
    return map;
  })();

  const usersMap = (() => {
    if (!users || !Array.isArray(users)) return {};
    const map = {};
    users.forEach(user => {
      if (!user) return;
      const id = user.id || user.userId;
      if (!id) return;
      
      // Si el usuario tiene personId, buscar el nombre de la persona
      if (user.personId && personsMap[user.personId]) {
        map[id] = personsMap[user.personId];
        // También mapear el personId al mismo nombre
        map[user.personId] = personsMap[user.personId];
      } else {
        const username = user.username || user.userName || user.name || user.nombre || user.email || '';
        map[id] = username || 'Sin usuario';
      }
    });
    return map;
  })();

  const areasMap = (() => {
    if (!areas || !Array.isArray(areas)) return {};
    const map = {};
    areas.forEach(area => {
      if (!area) return;
      const id = area.id || area.areaId;
      if (!id) return;
      
      const name = area.name || area.areaName || area.nombre || area.description || area.descripcion || '';
      map[id] = name || 'Sin nombre';
    });
    return map;
  })();

  const locationsMap = (() => {
    if (!locations || !Array.isArray(locations)) return {};
    const map = {};
    locations.forEach(location => {
      if (!location) return;
      const id = location.id || location.locationId;
      if (!id) return;
      
      const name = location.name || location.locationName || location.nombre || location.description || location.descripcion || '';
      map[id] = name || 'Sin nombre';
    });
    return map;
  })();

  const resolve = (id, map, { pending = false } = {}) => {
    if (!id) return pending ? 'Pendiente' : EMPTY;
    const resolved = map?.[id] || map?.[String(id)];
    return resolved || 'Sin asignar';
  };

  const resolveUser = (userId) => {
    if (!userId) {
      return movement?.movementStatus === 'REQUESTED' ? 'Pendiente' : EMPTY;
    }
    return resolve(userId, usersMap) || EMPTY;
  };

  const reportTitle = movement?.movementNumber
    ? `Movimiento ${movement.movementNumber}`
    : 'Detalle de Movimiento';

  return (
    <Document title={reportTitle}>
      <ReportPage
        logo={municipalityLogo}
        title="Detalle de Movimiento"
        subtitle="Listado nominal del sistema"
        muniName={municipalityName}
      >
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaText}>Oficina: Gerencia Municipal</Text>
            <Text style={styles.metaText}>N° Movimiento: {movement?.movementNumber || 'N/A'}</Text>
          </View>
          <View>
            <Text style={[styles.metaText, { textAlign: 'right' }]}>Generado: {now.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
              <Text style={[styles.metaText, { marginRight: 6, marginTop: 0, marginBottom: 0 }]}>Estado:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: sc.bg, borderColor: sc.border },
                ]}
              >
                <Text style={{ color: sc.color, fontSize: 8, fontWeight: 'bold' }}>
                  {statusLabel(movement?.movementStatus)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.table}>
            <TableRow 
              label1="Código Movimiento:" 
              value1={movement?.movementNumber}
              label2="Estado:" 
              value2={statusLabel(movement?.movementStatus)}
            />
            <TableRow 
              label1="Tipo de Movimiento:" 
              value1={typeLabel(movement?.movementType)}
              label2="Subtipo:" 
              value2={movement?.movementSubtype}
              isLast
            />
          </View>
        </View>

        {assetRows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {assetRows.length > 1 ? 'Bienes del Movimiento' : 'Bien Patrimonial'}
            </Text>
            <View style={styles.table}>
              <View style={styles.assetTableHeader}>
                <Text style={[styles.assetColNum, styles.assetHeaderText]}>N°</Text>
                <Text style={[styles.assetColName, styles.assetHeaderText]}>Descripción</Text>
                <Text style={[styles.assetColQty, styles.assetHeaderText]}>Cant.</Text>
              </View>
              {assetRows.map((row, index) => (
                <View
                  key={`${row.line}-${row.name}`}
                  style={index === assetRows.length - 1 ? styles.assetTableRowLast : styles.assetTableRow}
                >
                  <Text style={styles.assetColNum}>{row.line}</Text>
                  <Text style={styles.assetColName}>{row.name}</Text>
                  <Text style={styles.assetColQty}>{row.quantity}</Text>
                </View>
              ))}
            </View>
            {assetRows.length > 1 && (
              <Text style={styles.assetSummary}>
                {assetRows.length} bienes · {totalUnits} unidad(es)
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fechas y Responsables de Operación</Text>
          <View style={styles.table}>
            <TableRow
              label1="Fecha de Solicitud:"
              value1={fmtOptionalDate(
                movement,
                'requestDate',
                'request_date',
                'createdAt',
                'created_at',
                { pendingWhenEmpty: false }
              )}
              label2="Solicitado Por:"
              value2={resolveUser(movement?.requestingUser)}
            />
            <TableRow
              label1="Fecha de Aprobación:"
              value1={fmtOptionalDate(
                movement,
                'approvalDate',
                'approval_date',
                'approvedAt',
                'approved_at'
              )}
              label2="Aprobado Por:"
              value2={resolve(movement?.approvedBy, usersMap, {
                pending: movement?.movementStatus === 'REQUESTED',
              })}
            />
            <TableRow
              label1="Fecha de Traslado Físico:"
              value1={fmtOptionalDate(
                movement,
                'executionDate',
                'execution_date',
                'executedAt',
                'executed_at',
                'inProcessDate',
                'in_process_date'
              )}
              label2="Fecha de Recepción:"
              value2={fmtOptionalDate(
                movement,
                'receptionDate',
                'reception_date',
                'receivedAt',
                'received_at',
                'completionDate',
                'completion_date',
                'completedAt',
                'completed_at',
                'completedDate',
                'completed_date'
              )}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Origen y Destino</Text>
          <View style={styles.table}>
            <TableRow 
              label1="Responsable Origen:" 
              value1={resolve(movement?.originResponsibleId, personsMap)}
              label2="Responsable Destino:" 
              value2={resolve(movement?.destinationResponsibleId, personsMap)}
            />
            <TableRow 
              label1="Área Origen:" 
              value1={resolve(movement?.originAreaId, areasMap)}
              label2="Área Destino:" 
              value2={resolve(movement?.destinationAreaId, areasMap)}
            />
            <TableRow 
              label1="Ubicación Origen:" 
              value1={resolve(movement?.originLocationId, locationsMap)}
              label2="Ubicación Destino:" 
              value2={resolve(movement?.destinationLocationId, locationsMap)}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo y Observaciones</Text>
          <View style={styles.table}>
            <TableRowFull 
              label="Motivo:" 
              value={movement?.reason}
              isLast={!movement?.observations && !movement?.specialConditions}
            />
            {movement?.observations && (
              <TableRowFull 
                label="Observaciones:" 
                value={movement.observations}
                isLast={!movement?.specialConditions}
              />
            )}
            {movement?.specialConditions && (
              <TableRowFull 
                label="Condiciones Especiales:" 
                value={movement.specialConditions}
                isLast
              />
            )}
          </View>
        </View>

        {(movement?.supportingDocumentNumber || movement?.supportingDocumentType) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documentación de Respaldo</Text>
            <View style={styles.table}>
              <TableRow 
                label1="Tipo de Documento:" 
                value1={movement?.supportingDocumentType}
                label2="N° Documento:" 
                value2={movement?.supportingDocumentNumber}
                isLast
              />
            </View>
          </View>
        )}

      </ReportPage>
    </Document>
  );
};

export default MovementDetailReport;
