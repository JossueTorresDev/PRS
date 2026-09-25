import React from 'react';
import { Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { ReportPage, TableHeader, TableRow, TableCell, COLORS } from '../../../shared/reports';
import { DISPOSAL_STATUS, DISPOSAL_TYPES } from '../services/disposalService';

const assetValue = (asset) => {
  const v = asset.currentValue !== undefined ? asset.currentValue
    : asset.valorActual !== undefined ? asset.valorActual
    : asset.acquisitionValue !== undefined ? asset.acquisitionValue
    : asset.valorAdquisicion;
  return v !== undefined ? `S/ ${parseFloat(v).toFixed(2)}` : '-';
};

const styles = StyleSheet.create({
  // Meta section
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SLATE_200,
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    color: COLORS.SLATE_800,
    fontWeight: 'bold',
  },

  // Card / Ficha styles
  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.SLATE_200,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    backgroundColor: COLORS.NAVY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.SLATE_200,
  },
  infoLabel: {
    width: '35%',
    fontSize: 8,
    color: COLORS.SLATE_600,
    fontWeight: 'bold',
  },
  infoValue: {
    width: '65%',
    fontSize: 8,
    color: COLORS.SLATE_800,
  },
  infoRowLast: {
    flexDirection: 'row',
    paddingVertical: 4,
  },

  // Summary box (bienes)
  summaryContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    backgroundColor: COLORS.NAVY,
    padding: 10,
    borderRadius: 4,
    minWidth: 220,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#cbd5e1',
  },
  summaryValue: {
    fontSize: 9,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },

  // QR section
  qrContainer: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.SLATE_200,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.SLATE_800,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 8,
  },
  qrValue: {
    fontSize: 9,
    color: COLORS.SLATE_600,
  },

  // Section title
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
    color: COLORS.SLATE_800,
  },

  // Group card (bajas list, depreciaciones)
  groupCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.SLATE_200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  groupHeader: {
    backgroundColor: COLORS.NAVY,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  groupHeaderText: {
    color: COLORS.WHITE,
    fontSize: 8,
    fontWeight: 'bold',
  },
  groupBody: {
    padding: 6,
  },

  // Signatures
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 170,
    borderTopWidth: 1,
    borderTopColor: COLORS.SLATE_800,
    paddingTop: 8,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.SLATE_800,
    fontWeight: 'bold',
  },
  signatureRole: {
    fontSize: 7.5,
    color: COLORS.SLATE_600,
    marginTop: 2,
  },
});

const DISPOSAL_REASONS = {
  ESTADO_INSERVIBLE: 'Estado inservible - No puede repararse',
  OBSOLESCENCIA_TECNICA: 'Obsolescencia técnica - Sin soporte o repuestos',
  DETERIORO_FISICO: 'Deterioro físico grave',
  SINIESTRO: 'Siniestro (robo, incendio, desastre natural)',
  PERDIDA: 'Pérdida o extravío',
  DONACION_APROBADA: 'Donación aprobada por autoridad competente',
  TRANSFERENCIA_INSTITUCIONAL: 'Transferencia a otra institución',
  OTRO: 'Otro motivo justificado',
};

const getDisposalTypeLabel = (type) => DISPOSAL_TYPES.find((item) => item.value === type)?.label || type || '-';
const getDisposalStatusLabel = (status) => DISPOSAL_STATUS.find((item) => item.value === status)?.label || status || '-';
const getDisposalReasonLabel = (reason) => DISPOSAL_REASONS[reason] || reason || '-';

const Signatures = ({ municipalityName }) => (
  <View style={styles.signatureSection}>
    <View style={styles.signatureBox}>
      <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
      <Text style={styles.signatureRole}>SIPREB — {municipalityName}</Text>
    </View>
    <View style={styles.signatureBox}>
      <Text style={styles.signatureLabel}>Jefe de Área</Text>
      <Text style={styles.signatureRole}>Área Correspondiente</Text>
    </View>
  </View>
);

export const ReportDocument = ({ type = 'bienes', items = [], meta = {}, municipalityLogo, municipalityName }) => {
  const logo = municipalityLogo || sessionStorage.getItem('muniLogo');
  const muniName = municipalityName || sessionStorage.getItem('muniName') || 'MUNICIPALIDAD';
  const reportTitle = meta.title || 'Reporte';
  const subtitle = meta.subtitle || muniName;

  if (type === 'bienes') {
    const totalValue = items.reduce((sum, it) => {
      const v = it.currentValue !== undefined ? it.currentValue
        : it.valorActual !== undefined ? it.valorActual
        : it.acquisitionValue !== undefined ? it.acquisitionValue
        : it.valorAdquisicion || 0;
      return sum + parseFloat(v);
    }, 0);

    const columns = [
      { label: 'N°', width: '6%' },
      { label: 'Código Patrimonial', width: '16%' },
      { label: 'Descripción', width: '28%' },
      { label: 'Marca/Modelo', width: '14%' },
      { label: 'Estado', width: '10%' },
      { label: 'Ubicación', width: '14%' },
      { label: 'Valor (S/)', width: '12%' },
    ];

    return (
      <Document>
        <ReportPage logo={logo} title={reportTitle} subtitle={subtitle} muniName={muniName}>
          <View style={styles.metaSection}>
            <View>
              <Text style={styles.metaLabel}>Módulo</Text>
              <Text style={styles.metaValue}>Patrimonio</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Registros</Text>
              <Text style={styles.metaValue}>{items.length}</Text>
            </View>
          </View>

          <View>
            <TableHeader columns={columns} />
            {items.map((it, i) => (
              <TableRow key={it.id || i} index={i}>
                <TableCell width={columns[0].width}>{String(i + 1)}</TableCell>
                <TableCell width={columns[1].width}>
                  <Text style={{ fontSize: 7 }}>{it.assetCode || it.codigoPatrimonial || '-'}</Text>
                </TableCell>
                <TableCell width={columns[2].width}>
                  <Text style={{ fontSize: 7 }}>{it.description || it.descripcion || '-'}</Text>
                </TableCell>
                <TableCell width={columns[3].width}>
                  <Text style={{ fontSize: 7 }}>{[it.brand || it.marca, it.model || it.modelo].filter(Boolean).join(' / ') || '-'}</Text>
                </TableCell>
                <TableCell width={columns[4].width}>
                  <Text style={{ fontSize: 7 }}>{it.assetStatus || it.estadoBien || '-'}</Text>
                </TableCell>
                <TableCell width={columns[5].width}>
                  <Text style={{ fontSize: 7 }}>{it.ubicacionActual || (it.location?.name) || '-'}</Text>
                </TableCell>
                <TableCell width={columns[6].width}>
                  <Text style={{ fontSize: 7 }}>{assetValue(it)}</Text>
                </TableCell>
              </TableRow>
            ))}
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total de Bienes:</Text>
                <Text style={styles.summaryValue}>{items.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Valor Total:</Text>
                <Text style={styles.summaryValue}>{`S/ ${totalValue.toFixed(2)}`}</Text>
              </View>
            </View>
          </View>

          <Signatures municipalityName={muniName} />
        </ReportPage>
      </Document>
    );
  }

  if (type === 'bajas') {
    const isIndividualReport = meta.isIndividual === true;

    if (isIndividualReport && items.length > 0) {
      const d = items[0];
      const assets = d.assets || [];

      return (
        <Document>
          <ReportPage logo={logo} title={reportTitle} subtitle={subtitle} muniName={muniName}>
            <View style={styles.card}>
              <Text style={styles.cardSectionTitle}>Datos del Expediente</Text>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Número:</Text>
                  <Text style={styles.infoValue}>{d.fileNumber || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo de Baja:</Text>
                  <Text style={styles.infoValue}>{getDisposalTypeLabel(d.disposalType)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Motivo:</Text>
                  <Text style={styles.infoValue}>{getDisposalReasonLabel(d.disposalReason)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estado:</Text>
                  <Text style={styles.infoValue}>{getDisposalStatusLabel(d.fileStatus || d.status)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Descripción:</Text>
                  <Text style={styles.infoValue}>{d.reasonDescription || d.description || d.disposalDescription || '-'}</Text>
                </View>
                <View style={styles.infoRowLast}>
                  <Text style={styles.infoLabel}>Total Bienes:</Text>
                  <Text style={styles.infoValue}>{assets.length} bien{assets.length !== 1 ? 'es' : ''}</Text>
                </View>
              </View>
            </View>

            {assets.length > 0 && (
              <Text style={styles.sectionTitle}>Bienes del Expediente</Text>
            )}

            {assets.length > 0 && (
              <View>
                <TableHeader columns={[
                  { label: 'Código', width: '22%' },
                  { label: 'Descripción', width: '38%' },
                  { label: 'Val. Libro', width: '15%' },
                  { label: 'Val. Recup.', width: '15%' },
                  { label: 'Recomendación', width: '10%' }
                ]} />
                {assets.map((a, i) => {
                  const recommendationLabels = {
                    'DESTROY': 'Destruir',
                    'DONATE': 'Donar',
                    'SELL': 'Vender',
                    'RECYCLE': 'Reciclar',
                    'TRANSFER': 'Transferir'
                  };
                  const recommendation = recommendationLabels[a.recommendation] || a.recomendacion || 'Sin definir';
                  return (
                    <TableRow key={a.id || i} index={i}>
                      <TableCell width="22%">{a.assetCode || '-'}</TableCell>
                      <TableCell width="38%">{a.assetDescription || a.descripcion || a.description || '-'}</TableCell>
                      <TableCell width="15%">{`S/ ${parseFloat(a.bookValue || '0').toFixed(2)}`}</TableCell>
                      <TableCell width="15%">{`S/ ${parseFloat(a.recoverableValue || '0').toFixed(2)}`}</TableCell>
                      <TableCell width="10%"><Text style={{ fontSize: 7 }}>{recommendation}</Text></TableCell>
                    </TableRow>
                  );
                })}
              </View>
            )}

            {assets.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10, color: COLORS.SLATE_800 }}>Códigos QR de los Bienes</Text>
                {assets.map((a, i) => {
                  const qrValue = a.qrCode || a.assetCode || '-';
                  const qrDataUrl = a.qrDataUrl || meta.qrDataUrl;
                  const assetName = a.assetDescription || a.descripcion || a.description || '-';
                  return (
                    <View key={a.id || i} style={styles.qrContainer}>
                      <Text style={styles.qrTitle}>{a.assetCode || `Bien ${i + 1}`}</Text>
                      <Text style={{ fontSize: 8, color: COLORS.SLATE_600, marginBottom: 8 }}>{assetName}</Text>
                      {qrDataUrl ? (
                        <Image src={qrDataUrl} style={styles.qrCode} />
                      ) : (
                        <Text style={{ fontSize: 10, color: COLORS.SLATE_500 }}>QR no disponible</Text>
                      )}
                      <Text style={styles.qrValue}>{qrValue}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <Signatures municipalityName={muniName} />
          </ReportPage>
        </Document>
      );
    }

    // Listado de expedientes
    const disposalColumns = [
      { label: 'Código', width: '20%' },
      { label: 'Nombre del Bien', width: '40%' },
      { label: 'Val. Libro', width: '15%' },
      { label: 'Val. Recup.', width: '15%' },
      { label: 'Recomendación', width: '10%' }
    ];

    return (
      <Document>
        <ReportPage logo={logo} title={reportTitle} subtitle={subtitle} muniName={muniName}>
          <View style={styles.metaSection}>
            <View>
              <Text style={styles.metaLabel}>Módulo</Text>
              <Text style={styles.metaValue}>Patrimonio - Bajas</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Expedientes</Text>
              <Text style={styles.metaValue}>{items.length}</Text>
            </View>
          </View>

          {items.map((d, idx) => {
            const assets = d.assets || [];
            return (
              <View key={d.id || idx} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderText}>
                    {`Expediente: ${d.fileNumber || `Expediente ${idx + 1}`}`}
                  </Text>
                </View>
                <View style={styles.groupBody}>
                  <Text style={{ fontSize: 7.5, color: COLORS.SLATE_600, marginBottom: 4 }}>
                    {`Motivo: ${getDisposalReasonLabel(d.disposalReason || d.name || d.reasonDescription)}`}
                  </Text>
                  <Text style={{ fontSize: 7.5, color: COLORS.SLATE_600, marginBottom: 6 }}>
                    {`Descripción: ${d.reasonDescription || d.description || d.disposalDescription || '-'}`}
                  </Text>
                  {assets.length === 0 ? (
                    <Text style={{ fontSize: 7, color: COLORS.SLATE_400, fontStyle: 'italic', marginBottom: 4 }}>
                      No hay bienes registrados en este expediente
                    </Text>
                  ) : (
                    <View>
                      <TableHeader columns={disposalColumns} />
                      {assets.map((a, i) => {
                        const recommendationLabels = {
                          'DESTROY': 'Destruir',
                          'DONATE': 'Donar',
                          'SELL': 'Vender',
                          'RECYCLE': 'Reciclar',
                          'TRANSFER': 'Transferir'
                        };
                        const recommendation = recommendationLabels[a.recommendation] || a.recomendacion || 'Sin definir';
                        return (
                          <TableRow key={a.id || i} index={i}>
                            <TableCell width="20%">{a.assetCode || '-'}</TableCell>
                            <TableCell width="40%">{a.assetDescription || a.descripcion || a.description || '-'}</TableCell>
                            <TableCell width="15%">{`S/ ${parseFloat(a.bookValue || '0').toFixed(2)}`}</TableCell>
                            <TableCell width="15%">{`S/ ${parseFloat(a.recoverableValue || '0').toFixed(2)}`}</TableCell>
                            <TableCell width="10%"><Text style={{ fontSize: 7 }}>{recommendation}</Text></TableCell>
                          </TableRow>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          <Signatures municipalityName={muniName} />
        </ReportPage>
      </Document>
    );
  }

  if (type === 'depreciaciones') {
    const depColumns = [
      { label: 'Año', width: '25%' },
      { label: 'Mes', width: '25%' },
      { label: 'Dep. Mensual', width: '25%' },
      { label: 'Acumulada', width: '25%' }
    ];

    return (
      <Document>
        <ReportPage logo={logo} title={reportTitle} subtitle={subtitle} muniName={muniName}>
          <View style={styles.metaSection}>
            <View>
              <Text style={styles.metaLabel}>Módulo</Text>
              <Text style={styles.metaValue}>Patrimonio - Depreciaciones</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Bienes</Text>
              <Text style={styles.metaValue}>{items.length}</Text>
            </View>
          </View>

          {items.map((group, idx) => (
            <View key={group.assetId || idx} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupHeaderText}>
                  {group.assetCode || group.codigoPatrimonial || `Bien ${idx + 1}`}
                </Text>
              </View>
              <View style={styles.groupBody}>
                <TableHeader columns={depColumns} />
                {(group.depreciations || []).map((d, i) => (
                  <TableRow key={d.id || i} index={i}>
                    <TableCell width="25%">{d.fiscalYear}</TableCell>
                    <TableCell width="25%">{d.calculationMonth}</TableCell>
                    <TableCell width="25%">{`S/ ${parseFloat(d.monthlyDepreciation || 0).toFixed(2)}`}</TableCell>
                    <TableCell width="25%">{`S/ ${parseFloat(d.currentAccumulatedDepreciation || 0).toFixed(2)}`}</TableCell>
                  </TableRow>
                ))}
              </View>
            </View>
          ))}

          <Signatures municipalityName={muniName} />
        </ReportPage>
      </Document>
    );
  }

  if (type === 'bien' && items.length > 0) {
    const asset = items[0];
    const qrValue = asset.qrCode || asset.codigoQr || asset.assetCode || asset.codigoPatrimonial || '';
    const assetName = asset.description || asset.descripcion || '';
    const modelStr = [asset.brand || asset.marca, asset.model || asset.modelo].filter(Boolean).join(' / ');

    return (
      <Document>
        <ReportPage logo={logo} title={reportTitle} subtitle={subtitle} muniName={muniName}>
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Datos Generales</Text>
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Código Patrimonial:</Text>
                <Text style={styles.infoValue}>{asset.assetCode || asset.codigoPatrimonial || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>N° Inventario:</Text>
                <Text style={styles.infoValue}>{asset.inventoryNumber || asset.nroInventario || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Denominación:</Text>
                <Text style={styles.infoValue}>{assetName || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Marca / Modelo:</Text>
                <Text style={styles.infoValue}>{modelStr || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>N° de Serie:</Text>
                <Text style={styles.infoValue}>{asset.serialNumber || asset.serie || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Categoría:</Text>
                <Text style={styles.infoValue}>{asset.categoryName || asset.categoria || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado de Conservación:</Text>
                <Text style={styles.infoValue}>{asset.assetStatus || asset.estadoBien || '-'}</Text>
              </View>
              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Ubicación Actual:</Text>
                <Text style={styles.infoValue}>{asset.ubicacionActual || (asset.location?.name) || '-'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Datos de Adquisición</Text>
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor de Adquisición:</Text>
                <Text style={styles.infoValue}>{asset.acquisitionValue || asset.valorAdquisicion ? `S/ ${parseFloat(asset.acquisitionValue || asset.valorAdquisicion).toFixed(2)}` : '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor Actual / Neto:</Text>
                <Text style={styles.infoValue}>{asset.currentValue || asset.valorActual ? `S/ ${parseFloat(asset.currentValue || asset.valorActual).toFixed(2)}` : '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha de Adquisición:</Text>
                <Text style={styles.infoValue}>{asset.acquisitionDate || asset.fechaAdquisicion || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Documento / Factura:</Text>
                <Text style={styles.infoValue}>{asset.documentNumber || asset.invoiceNumber || asset.nroFactura || '-'}</Text>
              </View>
              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Responsable:</Text>
                <Text style={styles.infoValue}>{asset.responsableActual || (asset.responsible?.fullName) || '-'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Código QR del Bien</Text>
            {meta.qrDataUrl ? (
              <Image src={meta.qrDataUrl} style={styles.qrCode} />
            ) : null}
            <Text style={styles.qrValue}>{qrValue}</Text>
          </View>
        </ReportPage>
      </Document>
    );
  }

  return (
    <Document>
      <ReportPage logo={logo} title="Reporte" subtitle={subtitle} muniName={muniName}>
        <Text>No document</Text>
      </ReportPage>
    </Document>
  );
};

export default ReportDocument;
