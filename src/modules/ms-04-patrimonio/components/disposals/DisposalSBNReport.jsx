import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { COLORS, formatShortDate, formatCurrency } from '../../../../shared/reports';
import { DISPOSAL_TYPES, RECOMMENDATIONS } from '../../services/disposalService';

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

const CONSERVATION_LABELS = {
  GOOD: 'Bueno', REGULAR: 'Regular', BAD: 'Malo',
  OBSOLETE: 'Obsoleto', EXCELLENT: 'Excelente',
  NUEVO: 'Nuevo', BUENO: 'Bueno', MALO: 'Malo',
};

const RECOMMENDATION_LABELS = Object.fromEntries(
  RECOMMENDATIONS.map(r => [r.value, r.label])
);

const getLabel = (value, map) => (value ? map[value] || value : '-');

const localStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9 },
  header: {
    backgroundColor: COLORS.NAVY,
    margin: -30,
    marginBottom: 20,
    padding: 25,
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 8,
    marginTop: 4,
  },
  headerRight: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  headerRightLabel: {
    color: '#94a3b8',
    fontSize: 7,
    textTransform: 'uppercase',
  },
  headerRightValue: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.NAVY,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.NAVY,
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 2,
  },
  infoLabel: {
    width: '35%',
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.SLATE_600,
  },
  infoValue: {
    width: '65%',
    fontSize: 8,
    color: COLORS.SLATE_800,
  },
  infoContainer: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.SLATE_200,
  },
  normativaContainer: {
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  normativaText: {
    fontSize: 7,
    color: '#1e40af',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  table: { marginTop: 6 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.NAVY,
    borderRadius: 2,
  },
  tableHeaderCell: {
    padding: 5,
    color: COLORS.WHITE,
    fontSize: 7,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.SLATE_200,
    minHeight: 24,
    alignItems: 'center',
  },
  tableCell: {
    padding: 4,
    fontSize: 7,
    color: COLORS.SLATE_800,
  },
  opinionBox: {
    padding: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 4,
  },
  opinionLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 2,
  },
  opinionText: {
    fontSize: 7,
    color: '#78350f',
    lineHeight: 1.4,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 7,
    color: COLORS.SLATE_600,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 160,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: COLORS.SLATE_800,
    marginBottom: 6,
    paddingTop: 6,
  },
  signatureName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.SLATE_800,
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 7,
    color: COLORS.SLATE_600,
    textAlign: 'center',
    marginTop: 2,
  },
  qrSection: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qrItem: {
    width: '45%',
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.SLATE_200,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  qrImage: {
    width: 100,
    height: 100,
    marginBottom: 4,
  },
  qrLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: COLORS.SLATE_700,
    marginBottom: 2,
    textAlign: 'center',
  },
  qrCode: {
    fontSize: 6,
    color: COLORS.SLATE_500,
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.SLATE_200,
    fontSize: 6,
    color: COLORS.SLATE_400,
    textAlign: 'center',
  },
});

export default function DisposalSBNReport({ disposal, assets = [], meta = {} }) {
  const totalBookValue = assets.reduce((sum, a) => sum + parseFloat(a.bookValue || 0), 0);
  const totalRecoverableValue = assets.reduce((sum, a) => sum + parseFloat(a.recoverableValue || 0), 0);
  const assetCount = assets.length;

  return (
    <Document>
      <Page size="A4" style={localStyles.page}>
        {/* Header */}
        <View style={localStyles.header}>
          <View style={localStyles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={localStyles.headerTitle}>Reporte de Baja Patrimonial</Text>
              <Text style={localStyles.headerSubtitle}>
                Superintendencia Nacional de Bienes Estatales - SBN
              </Text>
              <Text style={localStyles.headerSubtitle}>
                Ley Nº 29151 - D.S. Nº 007-2008-VIVIENDA
              </Text>
            </View>
            <View style={localStyles.headerRight}>
              <Text style={localStyles.headerRightLabel}>Expediente Nº</Text>
              <Text style={localStyles.headerRightValue}>
                {disposal.fileNumber || '---'}
              </Text>
            </View>
          </View>
        </View>

        {/* Marco Normativo */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>Marco Normativo</Text>
          <View style={localStyles.normativaContainer}>
            <Text style={localStyles.normativaText}>
              • Ley Nº 29151 - Ley General del Sistema Nacional de Bienes Estatales
            </Text>
            <Text style={localStyles.normativaText}>
              • Decreto Supremo Nº 007-2008-VIVIENDA - Reglamento de la Ley General del Sistema Nacional de Bienes Estatales
            </Text>
            <Text style={localStyles.normativaText}>
              • Directiva Nº 001-2023-SBN - Procedimientos para la baja y disposición final de bienes estatales
            </Text>
            <Text style={localStyles.normativaText}>
              • Resolución Nº ... - Normativa interna de la entidad para la gestión de bienes patrimoniales
            </Text>
          </View>
        </View>

        {/* Datos del Expediente */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>Datos del Expediente</Text>
          <View style={localStyles.infoContainer}>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>N° de Expediente:</Text>
              <Text style={localStyles.infoValue}>{disposal.fileNumber || '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Tipo de Baja:</Text>
              <Text style={localStyles.infoValue}>
                {getLabel(disposal.disposalType, Object.fromEntries(DISPOSAL_TYPES.map(t => [t.value, t.label])))}
              </Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Motivo de Baja:</Text>
              <Text style={localStyles.infoValue}>{getLabel(disposal.disposalReason, DISPOSAL_REASONS)}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Descripción del Motivo:</Text>
              <Text style={localStyles.infoValue}>{disposal.reasonDescription || disposal.description || '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Estado:</Text>
              <Text style={localStyles.infoValue}>Ejecutado</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Fecha de Creación:</Text>
              <Text style={localStyles.infoValue}>{formatShortDate(disposal.createdAt) || '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Fecha de Aprobación:</Text>
              <Text style={localStyles.infoValue}>{formatShortDate(disposal.approvalDate) || '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Fecha de Ejecución:</Text>
              <Text style={localStyles.infoValue}>{formatShortDate(disposal.physicalRemovalDate) || '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>N° de Resolución:</Text>
              <Text style={localStyles.infoValue}>{disposal.resolutionNumber || '-'}</Text>
            </View>
            <View style={localStyles.infoRow}>
              <Text style={localStyles.infoLabel}>Cantidad de Bienes:</Text>
              <Text style={localStyles.infoValue}>{assetCount} bien{assetCount !== 1 ? 'es' : ''}</Text>
            </View>
          </View>
        </View>

        {/* Dictamen Técnico */}
        {assets.some(a => a.technicalOpinion) && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>Dictamen Técnico</Text>
            {assets.filter(a => a.technicalOpinion).map((a, i) => (
              <View key={a.id || i} style={localStyles.opinionBox}>
                <Text style={localStyles.opinionLabel}>
                  {a.assetCode || 'Bien'} - {a.assetDescription || '-'}
                </Text>
                <Text style={localStyles.opinionText}>{a.technicalOpinion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Detalle de Bienes */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>Detalle de Bienes dados de Baja</Text>
          <View style={localStyles.table}>
            <View style={localStyles.tableHeader}>
              <Text style={[localStyles.tableHeaderCell, { width: '15%' }]}>Código</Text>
              <Text style={[localStyles.tableHeaderCell, { width: '25%' }]}>Descripción</Text>
              <Text style={[localStyles.tableHeaderCell, { width: '10%' }]}>Conservación</Text>
              <Text style={[localStyles.tableHeaderCell, { width: '12%' }]}>Val. Libro</Text>
              <Text style={[localStyles.tableHeaderCell, { width: '12%' }]}>Val. Recup.</Text>
              <Text style={[localStyles.tableHeaderCell, { width: '12%' }]}>Recomendación</Text>
              <Text style={[localStyles.tableHeaderCell, { width: '14%' }]}>Observaciones</Text>
            </View>
            {assets.map((a, i) => (
              <View key={a.id || i} style={[localStyles.tableRow, { backgroundColor: i % 2 === 0 ? COLORS.WHITE : '#f8fafc' }]}>
                <Text style={[localStyles.tableCell, { width: '15%' }]}>{a.assetCode || '-'}</Text>
                <Text style={[localStyles.tableCell, { width: '25%' }]}>
                  {(a.assetDescription || a.description || '').length > 40
                    ? (a.assetDescription || a.description || '').substring(0, 40) + '...'
                    : (a.assetDescription || a.description || '-')}
                </Text>
                <Text style={[localStyles.tableCell, { width: '10%' }]}>
                  {getLabel(a.conservationStatus || a.estadoFisico || a.estadoConservacion, CONSERVATION_LABELS)}
                </Text>
                <Text style={[localStyles.tableCell, { width: '12%' }]}>
                  {a.bookValue ? `S/ ${parseFloat(a.bookValue).toFixed(2)}` : '-'}
                </Text>
                <Text style={[localStyles.tableCell, { width: '12%' }]}>
                  {a.recoverableValue ? `S/ ${parseFloat(a.recoverableValue).toFixed(2)}` : '-'}
                </Text>
                <Text style={[localStyles.tableCell, { width: '12%' }]}>
                  {getLabel(a.recommendation, RECOMMENDATION_LABELS)}
                </Text>
                <Text style={[localStyles.tableCell, { width: '14%' }]}>
                  {(a.observations || '').length > 25
                    ? (a.observations || '').substring(0, 25) + '...'
                    : (a.observations || '-')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Resumen Económico */}
        <View style={localStyles.summaryBox}>
          <View style={localStyles.summaryItem}>
            <Text style={localStyles.summaryLabel}>Total Bienes</Text>
            <Text style={[localStyles.summaryValue, { color: COLORS.NAVY }]}>{assetCount}</Text>
          </View>
          <View style={localStyles.summaryItem}>
            <Text style={localStyles.summaryLabel}>Valor Total en Libros</Text>
            <Text style={localStyles.summaryValue}>
              {formatCurrency(totalBookValue)}
            </Text>
          </View>
          <View style={localStyles.summaryItem}>
            <Text style={localStyles.summaryLabel}>Valor Total de Recuperación</Text>
            <Text style={localStyles.summaryValue}>
              {formatCurrency(totalRecoverableValue)}
            </Text>
          </View>
        </View>

        {/* Firmas */}
        <View style={localStyles.signatureSection}>
          <View style={localStyles.signatureBox}>
            <View style={localStyles.signatureLine} />
            <Text style={localStyles.signatureName}>
              {meta.patrimonyHeadName || '____________________________'}
            </Text>
            <Text style={localStyles.signatureRole}>
              Responsable del Área de Patrimonio
            </Text>
          </View>
          <View style={localStyles.signatureBox}>
            <View style={localStyles.signatureLine} />
            <Text style={localStyles.signatureName}>
              {meta.committeePresidentName || '____________________________'}
            </Text>
            <Text style={localStyles.signatureRole}>
              Presidente del Comité de Evaluación
            </Text>
          </View>
          <View style={localStyles.signatureBox}>
            <View style={localStyles.signatureLine} />
            <Text style={localStyles.signatureName}>
              {meta.adminHeadName || '____________________________'}
            </Text>
            <Text style={localStyles.signatureRole}>
              Jefe de la Oficina de Administración
            </Text>
          </View>
        </View>

        {/* Códigos QR */}
        {assets.length > 0 && (
          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>Códigos QR de los Bienes</Text>
            <View style={localStyles.qrSection}>
              {assets.map((a, i) => (
                <View key={a.id || i} style={localStyles.qrItem}>
                  <Text style={localStyles.qrLabel}>{a.assetCode || `Bien ${i + 1}`}</Text>
                  <Text style={{ fontSize: 6, color: COLORS.SLATE_500, marginBottom: 4, textAlign: 'center' }}>
                    {(a.assetDescription || a.description || '').length > 30
                      ? (a.assetDescription || a.description || '').substring(0, 30) + '...'
                      : (a.assetDescription || a.description || '-')}
                  </Text>
                  {a.qrDataUrl ? (
                    <Image src={a.qrDataUrl} style={localStyles.qrImage} />
                  ) : (
                    <Text style={{ fontSize: 7, color: COLORS.SLATE_400, marginVertical: 40 }}>QR no disponible</Text>
                  )}
                  <Text style={localStyles.qrCode}>{a.qrCode || a.assetCode || ''}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={localStyles.footer}>
          <Text>Municipalidad de San Luis - Sistema SIPREB</Text>
          <Text>Reporte generado: {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
          <Text>Documento generado electrónicamente - Validez sujeta a normativa interna</Text>
        </View>
      </Page>
    </Document>
  );
}
