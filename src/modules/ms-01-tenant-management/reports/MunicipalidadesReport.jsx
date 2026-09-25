import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { MetaSection, TableHeader, TableRow, TableCell, Footer, formatShortDate, formatDateTime, COLORS } from '../../../shared/reports';

const localStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.WHITE,
    position: 'relative',
  },
  headerWithLogo: {
    backgroundColor: COLORS.BRAND,
    margin: -30,
    marginBottom: 30,
    padding: 30,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: COLORS.SLATE_200,
    fontSize: 9,
    marginTop: 4,
  },
  headerLogo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 15,
    color: COLORS.BRAND,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 15,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#eef2f7',
    borderRadius: 2,
    borderTopWidth: 4,
  },
  metricCardPrimary: {
    borderTopColor: COLORS.BRAND,
  },
  metricCardSuccess: {
    borderTopColor: COLORS.CYAN,
  },
  metricCardDanger: {
    borderTopColor: '#ef4444',
  },
  metricLabel: {
    fontSize: 7,
    color: COLORS.SLATE_600,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.BRAND,
  },
  tableContainer: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    backgroundColor: COLORS.BRAND,
    padding: 8,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.SLATE_200,
  },
  detailLabel: {
    width: '40%',
    fontSize: 9,
    color: COLORS.SLATE_600,
    fontWeight: 'bold',
  },
  detailValue: {
    width: '60%',
    fontSize: 9,
    color: COLORS.SLATE_800,
  },
  summaryBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.CYAN,
    borderRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.SLATE_200,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.SLATE_800,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.SLATE_800,
  },
  distributionTable: {
    marginTop: 8,
    marginBottom: 0,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.SLATE_200,
    backgroundColor: '#f8fafc',
  },
  distLabel: {
    fontSize: 8,
    color: COLORS.SLATE_700,
    fontWeight: '500',
    width: '70%',
  },
  distValue: {
    fontSize: 8,
    color: COLORS.BRAND,
    fontWeight: 'bold',
    width: '30%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.SLATE_200,
    marginVertical: 12,
  },
});

const ReportHeaderWithLogo = ({ title, subtitle, logoUrl }) => (
  <View style={localStyles.headerWithLogo}>
    <View style={localStyles.headerContent}>
      <View style={localStyles.headerTextBlock}>
        <Text style={localStyles.headerTitle}>{title}</Text>
        <Text style={localStyles.headerSubtitle}>{subtitle}</Text>
      </View>
      {logoUrl ? (
        <Image src={logoUrl} style={localStyles.headerLogo} />
      ) : null}
    </View>
  </View>
);

export const MunicipalidadesReportDocument = ({ municipalidades = [], meta = {} }) => {
  const columns = [
    { label: 'Municipalidad', width: '30%' },
    { label: 'RUC', width: '15%' },
    { label: 'Tipo', width: '20%' },
    { label: 'Departamento', width: '20%' },
    { label: 'Estado', width: '15%' },
  ];

  // Cálculos de métricas
  const totalMuni = municipalidades.length;
  const activeMuni = municipalidades.filter(m => m.activo).length;
  const inactiveMuni = municipalidades.filter(m => !m.activo).length;
  const porcentajeActivo = totalMuni > 0 ? Math.round((activeMuni / totalMuni) * 100) : 0;

  // Distribución por tipo
  const tipoDistribution = {};
  municipalidades.forEach(m => {
    const tipo = m.tipo || 'Sin clasificar';
    tipoDistribution[tipo] = (tipoDistribution[tipo] || 0) + 1;
  });

  // Distribución por departamento
  const deptDistribution = {};
  municipalidades.forEach(m => {
    const dept = m.departamento || 'Sin especificar';
    deptDistribution[dept] = (deptDistribution[dept] || 0) + 1;
  });

  return (
    <Document>
      <Page size="A4" style={localStyles.page}>
        <ReportHeaderWithLogo
          title={meta.title || 'Reporte de Municipalidades'}
          subtitle={meta.subtitle || 'Listado general'}
          logoUrl={meta.logoUrl}
        />
        
        <MetaSection 
          entity={meta.entity || 'Municipalidad de San Luis'}
          office={meta.office || 'Administración'}
          dateStr={formatDateTime(new Date())} 
        />

        {/* TARJETAS DE MÉTRICAS */}
        <View style={localStyles.metricsContainer}>
          <View style={[localStyles.metricCard, localStyles.metricCardPrimary]}>
            <Text style={localStyles.metricLabel}>Total</Text>
            <Text style={localStyles.metricValue}>{totalMuni}</Text>
          </View>
          <View style={[localStyles.metricCard, localStyles.metricCardSuccess]}>
            <Text style={localStyles.metricLabel}>Activas</Text>
            <Text style={localStyles.metricValue}>{activeMuni}</Text>
          </View>
          <View style={[localStyles.metricCard, localStyles.metricCardDanger]}>
            <Text style={localStyles.metricLabel}>Inactivas</Text>
            <Text style={localStyles.metricValue}>{inactiveMuni}</Text>
          </View>
          <View style={[localStyles.metricCard, localStyles.metricCardPrimary]}>
            <Text style={localStyles.metricLabel}>% Activas</Text>
            <Text style={localStyles.metricValue}>{porcentajeActivo}%</Text>
          </View>
        </View>

        {/* TABLA PRINCIPAL */}
        <View style={localStyles.tableContainer}>
          <Text style={localStyles.sectionTitle}>Listado de Municipalidades</Text>
          <TableHeader columns={columns} />
          {municipalidades.map((mun, i) => (
            <TableRow key={mun.id || i} index={i}>
              <TableCell width={columns[0].width}>{mun.nombre || '-'}</TableCell>
              <TableCell width={columns[1].width}>{mun.ruc || '-'}</TableCell>
              <TableCell width={columns[2].width}>{mun.tipo || '-'}</TableCell>
              <TableCell width={columns[3].width}>{mun.departamento || '-'}</TableCell>
              <TableCell width={columns[4].width}>{mun.activo ? 'Activo' : 'Inactivo'}</TableCell>
            </TableRow>
          ))}
        </View>

        {/* DISTRIBUCIÓN POR TIPO */}
        <View style={localStyles.tableContainer}>
          <Text style={localStyles.sectionTitle}>Distribución por Tipo</Text>
          {Object.entries(tipoDistribution).map(([tipo, count], i) => (
            <View key={i} style={localStyles.distRow}>
              <Text style={localStyles.distLabel}>{tipo}</Text>
              <Text style={localStyles.distValue}>{count}</Text>
            </View>
          ))}
        </View>

        {/* DISTRIBUCIÓN POR DEPARTAMENTO */}
        <View style={localStyles.tableContainer}>
          <Text style={localStyles.sectionTitle}>Distribución por Departamento</Text>
          {Object.entries(deptDistribution).map(([dept, count], i) => (
            <View key={i} style={localStyles.distRow}>
              <Text style={localStyles.distLabel}>{dept}</Text>
              <Text style={localStyles.distValue}>{count}</Text>
            </View>
          ))}
        </View>

        {/* RESUMEN EJECUTIVO */}
        <View style={localStyles.summaryBox}>
          <Text style={[localStyles.sectionTitle, { marginTop: 0, marginBottom: 10, backgroundColor: COLORS.NAVY }]}>Resumen Ejecutivo</Text>
          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>Total de Municipalidades:</Text>
            <Text style={localStyles.summaryValue}>{totalMuni}</Text>
          </View>
          <View style={localStyles.summaryRow}>
            <Text style={localStyles.summaryLabel}>Municipalidades Activas:</Text>
            <Text style={localStyles.summaryValue}>{activeMuni} ({porcentajeActivo}%)</Text>
          </View>
          <View style={[localStyles.summaryRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
            <Text style={localStyles.summaryLabel}>Municipalidades Inactivas:</Text>
            <Text style={localStyles.summaryValue}>{inactiveMuni} ({100 - porcentajeActivo}%)</Text>
          </View>
        </View>

        <Footer 
          year={new Date().getFullYear()} 
          entity={meta.entity || 'Municipalidad de San Luis'}
          generatedDate={new Date()}
        />
      </Page>
    </Document>
  );
};

// Reporte detallado por municipalidad
export const MunicipalidadDetailReportDocument = ({ municipalidad = {}, meta = {} }) => {
  if (!municipalidad.id) {
    return (
      <Document>
        <Page size="A4" style={localStyles.page}>
          <Text>No hay datos disponibles</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={localStyles.page}>
        <ReportHeaderWithLogo
          title="FICHA DE MUNICIPALIDAD"
          subtitle="Información Detallada y Completa"
          logoUrl={meta.logoUrl || municipalidad.logoUrl}
        />
        
        <MetaSection 
          entity={meta.entity || 'Municipalidad de San Luis'}
          office={meta.office || 'Administración'}
          dateStr={formatDateTime(new Date())} 
        />

        {/* TARJETA DE ESTADO */}
        <View style={localStyles.metricsContainer}>
          <View style={[localStyles.metricCard, municipalidad.activo ? localStyles.metricCardSuccess : localStyles.metricCardDanger]}>
            <Text style={localStyles.metricLabel}>Estado</Text>
            <Text style={localStyles.metricValue}>{municipalidad.activo ? 'Activo' : 'Inactivo'}</Text>
          </View>
          <View style={[localStyles.metricCard, localStyles.metricCardPrimary]}>
            <Text style={localStyles.metricLabel}>Tipo</Text>
            <Text style={[localStyles.metricValue, { fontSize: 10 }]}>{municipalidad.tipo || '-'}</Text>
          </View>
          <View style={[localStyles.metricCard, localStyles.metricCardPrimary]}>
            <Text style={localStyles.metricLabel}>RUC</Text>
            <Text style={[localStyles.metricValue, { fontSize: 10 }]}>{municipalidad.ruc || '-'}</Text>
          </View>
          <View style={[localStyles.metricCard, localStyles.metricCardPrimary]}>
            <Text style={localStyles.metricLabel}>Ubigeo</Text>
            <Text style={[localStyles.metricValue, { fontSize: 10 }]}>{municipalidad.ubigeo || '-'}</Text>
          </View>
        </View>

        {/* INFORMACIÓN BÁSICA */}
        <Text style={localStyles.sectionTitle}>Información General</Text>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Nombre:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.nombre || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>RUC:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.ruc || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Tipo:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.tipo || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Estado:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.activo ? 'Activo' : 'Inactivo'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Ubigeo:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.ubigeo || '-'}</Text>
        </View>

        {/* UBICACIÓN GEOGRÁFICA */}
        <Text style={localStyles.sectionTitle}>Ubicación Geográfica</Text>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Departamento:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.departamento || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Provincia:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.provincia || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Distrito:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.distrito || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Dirección:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.direccion || '-'}</Text>
        </View>

        {/* INFORMACIÓN DE CONTACTO */}
        <Text style={localStyles.sectionTitle}>Información de Contacto</Text>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Teléfono:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.telefono || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Celular:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.celular || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Email:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.email || '-'}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Sitio Web:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.website || '-'}</Text>
        </View>

        {/* INFORMACIÓN DE AUTORIDADES */}
        <Text style={localStyles.sectionTitle}>Información de Autoridades</Text>
        <View style={[localStyles.detailRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
          <Text style={localStyles.detailLabel}>Alcalde:</Text>
          <Text style={localStyles.detailValue}>{municipalidad.alcalde || '-'}</Text>
        </View>

        <Footer 
          year={new Date().getFullYear()} 
          entity={municipalidad.nombre || 'Municipalidad'}
          generatedDate={new Date()}
        />
      </Page>
    </Document>
  );
};
