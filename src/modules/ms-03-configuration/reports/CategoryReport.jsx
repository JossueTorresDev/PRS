import React from 'react';
import { Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage } from '../../../shared/reports';

const NAVY      = '#1a365d';
const EMERALD   = '#059669';
const SLATE_800 = '#1e293b';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const CYAN_600  = '#0891b2';

const styles = StyleSheet.create({
  metaSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 18, borderBottomWidth: 1, borderBottomColor: SLATE_200, paddingBottom: 10,
  },
  metaLabel: { fontSize: 7, color: SLATE_400, textTransform: 'uppercase', marginBottom: 1 },
  metaValue: { fontSize: 8, color: SLATE_600 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 4,
    borderLeftWidth: 3, borderLeftColor: NAVY, padding: '8 10',
  },
  statLabel: { fontSize: 7, color: SLATE_400, textTransform: 'uppercase', marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: SLATE_800 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 3 },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: SLATE_200, minHeight: 28, alignItems: 'center',
  },
  tableColHeader: { padding: '5 6', color: '#ffffff', fontSize: 7.5, fontWeight: 'bold' },
  tableCol:       { padding: '5 6', fontSize: 7.5, color: SLATE_800 },
  signatureSection: { marginTop: 44, flexDirection: 'row', justifyContent: 'space-around' },
  signatureBox: {
    width: 140, borderTopWidth: 1, borderTopColor: SLATE_800,
    paddingTop: 6, alignItems: 'center',
  },
  signatureLabel: { fontSize: 8, color: SLATE_800, fontWeight: 'bold' },
  signatureSub:   { fontSize: 7, color: SLATE_600, marginTop: 2 },
  detailSection: { marginTop: 16 },
  detailCard: {
    borderWidth: 1, borderColor: SLATE_200, borderRadius: 4, overflow: 'hidden',
    marginBottom: 12,
  },
  detailCardHeader: {
    backgroundColor: NAVY, paddingHorizontal: 10, paddingVertical: 6,
  },
  detailCardHeaderText: {
    color: '#ffffff', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase',
  },
  detailCardBody: { padding: 10 },
  detailRow: {
    flexDirection: 'row', paddingVertical: 5,
    borderBottomWidth: 0.5, borderBottomColor: SLATE_200,
  },
  detailRowLast: { flexDirection: 'row', paddingVertical: 5 },
  detailLabel: { width: '38%', fontSize: 8, color: SLATE_600, fontWeight: 'bold' },
  detailValue: { width: '62%', fontSize: 8, color: SLATE_800 },
});

const CategoryReport = ({ categorias = [], allCategories = [], entity = 'Municipalidad', muniLogo = null }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const activas   = categorias.filter(c => c.active).length;
  const inactivas = categorias.length - activas;
  const parentById = allCategories.reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {});

  return (
    <Document>
      <ReportPage logo={muniLogo} title="Reporte General de Categorías" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName={entity}>
        <View style={styles.metaSection}>
          <View>
            <Text style={styles.metaLabel}>Entidad</Text>
            <Text style={styles.metaValue}>{entity}</Text>
            <Text style={[styles.metaLabel, { marginTop: 4 }]}>Oficina</Text>
            <Text style={styles.metaValue}>Gestión de Categorías</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Fecha de generación</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>
            <Text style={[styles.metaLabel, { marginTop: 4 }]}>Total registros</Text>
            <Text style={styles.metaValue}>{categorias.length} ({activas} activas / {inactivas} inactivas)</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Inventariables</Text>
            <Text style={styles.statValue}>{categorias.filter(c => c.isInventoriable).length}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: EMERALD }]}>
            <Text style={styles.statLabel}>C/ Serie</Text>
            <Text style={styles.statValue}>{categorias.filter(c => c.requiresSerial).length}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: CYAN_600 }]}>
            <Text style={styles.statLabel}>C/ Placa</Text>
            <Text style={styles.statValue}>{categorias.filter(c => c.requiresPlate).length}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={{ width: '10%' }}><Text style={styles.tableColHeader}>Código</Text></View>
            <View style={{ width: '18%' }}><Text style={styles.tableColHeader}>Nombre</Text></View>
            <View style={{ width: '22%' }}><Text style={styles.tableColHeader}>Descripción</Text></View>
            <View style={{ width: '14%' }}><Text style={styles.tableColHeader}>Cat. Padre</Text></View>
            <View style={{ width: '7%' }}><Text style={styles.tableColHeader}>Nivel</Text></View>
            <View style={{ width: '10%' }}><Text style={styles.tableColHeader}>Inventarial</Text></View>
            <View style={{ width: '9%' }}><Text style={styles.tableColHeader}>Serie</Text></View>
            <View style={{ width: '10%' }}><Text style={styles.tableColHeader}>Estado</Text></View>
          </View>

          {categorias.map((cat, i) => (
            <View key={cat.id || i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
              <View style={{ width: '10%' }}><Text style={[styles.tableCol, { fontWeight: 'bold' }]}>{cat.categoryCode || '—'}</Text></View>
              <View style={{ width: '18%' }}><Text style={styles.tableCol}>{cat.name || '—'}</Text></View>
              <View style={{ width: '22%' }}><Text style={styles.tableCol}>{(cat.description || '').length > 35 ? cat.description.substring(0, 35) + '...' : (cat.description || '—')}</Text></View>
              <View style={{ width: '14%' }}><Text style={styles.tableCol}>{cat.parentCategoryId ? parentById[cat.parentCategoryId] || '—' : '—'}</Text></View>
              <View style={{ width: '7%' }}><Text style={[styles.tableCol, { textAlign: 'center' }]}>{cat.level ?? '—'}</Text></View>
              <View style={{ width: '10%' }}>
                <Text style={[styles.tableCol, { color: cat.isInventoriable ? '#16a34a' : SLATE_400, fontWeight: 'bold', textAlign: 'center' }]}>
                  {cat.isInventoriable ? 'Sí' : 'No'}
                </Text>
              </View>
              <View style={{ width: '9%' }}>
                <Text style={[styles.tableCol, { color: cat.requiresSerial ? '#16a34a' : SLATE_400, fontWeight: 'bold', textAlign: 'center' }]}>
                  {cat.requiresSerial ? 'Sí' : 'No'}
                </Text>
              </View>
              <View style={{ width: '10%' }}>
                <Text style={[styles.tableCol, { color: cat.active ? '#16a34a' : SLATE_400, fontWeight: 'bold', textAlign: 'center' }]}>
                  {cat.active ? 'Activa' : 'Inactiva'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
            <Text style={styles.signatureSub}>SIPREB - {entity}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Jefe de Área</Text>
            <Text style={styles.signatureSub}>Gestión de Categorías</Text>
          </View>
        </View>
      </ReportPage>
    </Document>
  );
};

export const CategoryDetailReport = ({ category = {}, allCategories = [], entity = 'Municipalidad', muniLogo = null }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const parentName = category.parentCategoryId
    ? allCategories.find((c) => c.id === category.parentCategoryId)?.name || '—'
    : 'Ninguno';

  return (
    <Document>
      <ReportPage logo={muniLogo} title="Detalle de Categoría" subtitle={category.name || 'Sin Nombre'} muniName={entity}>
        <View style={styles.metaSection}>
          <View>
            <Text style={styles.metaLabel}>Entidad</Text>
            <Text style={styles.metaValue}>{entity}</Text>
            <Text style={[styles.metaLabel, { marginTop: 4 }]}>Oficina</Text>
            <Text style={styles.metaValue}>Gestión de Categorías</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Fecha de generación</Text>
            <Text style={styles.metaValue}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Text style={styles.detailCardHeaderText}>Identificación</Text>
            </View>
            <View style={styles.detailCardBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Código:</Text>
                <Text style={styles.detailValue}>{category.categoryCode || '—'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Categoría Padre:</Text>
                <Text style={styles.detailValue}>{parentName}</Text>
              </View>
              <View style={styles.detailRowLast}>
                <Text style={styles.detailLabel}>Nivel:</Text>
                <Text style={styles.detailValue}>{category.level ?? '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Text style={styles.detailCardHeaderText}>Información General</Text>
            </View>
            <View style={styles.detailCardBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nombre:</Text>
                <Text style={styles.detailValue}>{category.name || '—'}</Text>
              </View>
              <View style={styles.detailRowLast}>
                <Text style={styles.detailLabel}>Descripción:</Text>
                <Text style={styles.detailValue}>{category.description || '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Text style={styles.detailCardHeaderText}>Configuración</Text>
            </View>
            <View style={styles.detailCardBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Inventariable:</Text>
                <Text style={styles.detailValue}>{category.isInventoriable ? 'Sí' : 'No'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requiere Serie:</Text>
                <Text style={styles.detailValue}>{category.requiresSerial ? 'Sí' : 'No'}</Text>
              </View>
              <View style={styles.detailRowLast}>
                <Text style={styles.detailLabel}>Requiere Placa:</Text>
                <Text style={styles.detailValue}>{category.requiresPlate ? 'Sí' : 'No'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Text style={styles.detailCardHeaderText}>Sistema</Text>
            </View>
            <View style={styles.detailCardBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha de Generación:</Text>
                <Text style={styles.detailValue}>{dateStr}</Text>
              </View>
              <View style={styles.detailRowLast}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <Text style={[styles.detailValue, { color: category.active ? '#16a34a' : SLATE_400, fontWeight: 'bold' }]}>
                  {category.active ? 'Activa' : 'Inactiva'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Resp. de Sistemas</Text>
            <Text style={styles.signatureSub}>SIPREB - {entity}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Jefe de Área</Text>
            <Text style={styles.signatureSub}>Gestión de Categorías</Text>
          </View>
        </View>
      </ReportPage>
    </Document>
  );
};

export default CategoryReport;
