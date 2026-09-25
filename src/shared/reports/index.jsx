/**
 * Librería compartida para reportes PDF - SIPREB
 * Usar: import { ReportPage, Header, Footer, formatDate, ... } from '@/shared/reports'
 */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const reportLogo = () => sessionStorage.getItem('muniLogo') || null;
const reportName = () => sessionStorage.getItem('muniName') || '';

// === COLORES INSTITUCIONALES ===
export const COLORS = {
  NAVY: '#1a365d',
  BRAND: '#283447',
  SLATE_800: '#1e293b',
  SLATE_600: '#475569',
  SLATE_400: '#94a3b8',
  SLATE_200: '#e2e8f0',
  CYAN: '#0891b2',
  WHITE: '#ffffff',
};

// === ESTILOS BASE ===
export const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: COLORS.WHITE,
    fontFamily: 'Helvetica',
  },
  pageLandscape: {
    padding: 0,
    fontFamily: 'Helvetica',
  },

  // Header oscuro (legacy)
  header: {
    backgroundColor: COLORS.NAVY,
    margin: -30,
    marginBottom: 30,
    padding: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 9,
    marginTop: 4,
  },
  headerCompact: {
    backgroundColor: COLORS.BRAND,
    paddingHorizontal: 35,
    paddingVertical: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleCompact: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerSubtitleCompact: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8,
    marginTop: 3,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeHeader: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginTop: 6,
  },

  // Metadatos
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: COLORS.SLATE_200,
    paddingBottom: 10,
  },
  metaText: {
    fontSize: 8,
    color: COLORS.SLATE_600,
  },
  metaLabel: {
    fontSize: 7,
    color: COLORS.SLATE_400,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 9,
    color: COLORS.SLATE_800,
    fontWeight: 'bold',
  },

  // Tablas
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.NAVY,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SLATE_200,
    minHeight: 30,
    alignItems: 'center',
  },
  tableColHeader: {
    padding: 6,
    color: COLORS.WHITE,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 6,
    fontSize: 8,
    color: COLORS.SLATE_800,
  },

  // Firmas
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: COLORS.SLATE_800,
    paddingTop: 5,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: COLORS.SLATE_800,
    fontWeight: 'bold',
  },

  // Footer legacy
  footer: {
    marginTop: 40,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.SLATE_200,
    fontSize: 7,
    color: COLORS.SLATE_400,
    textAlign: 'center',
  },

  // ===== NUEVO ESTÁNDAR SBN =====
  watermark: {
    position: 'absolute',
    top: '38%',
    left: '35%',
    width: '30%',
    height: '25%',
    opacity: 0.06,
  },
  stdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.BRAND,
  },
  stdHeaderLogo: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  stdHeaderText: {
    flex: 1,
  },
  stdMuniName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.BRAND,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stdReportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.SLATE_800,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  stdSubtitle: {
    fontSize: 8,
    color: COLORS.SLATE_600,
    marginTop: 2,
  },
  stdFooter: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 7,
    color: COLORS.SLATE_400,
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.SLATE_200,
    paddingTop: 10,
  },
  stdFooterBold: {
    fontWeight: 'bold',
  },
});

// === COMPONENTES ===

export const Header = ({ title, subtitle, docType, code }) => (
  <View style={styles.header}>
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        {docType && (
          <View style={styles.badgeHeader}>
            <Text style={{ color: COLORS.WHITE, fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' }}>
              {docType}{code ? ` / ${code}` : ''}
            </Text>
          </View>
        )}
      </View>
      {reportLogo() && (
        <Image src={reportLogo()} style={{ height: 48 }} />
      )}
    </View>
  </View>
);

export const HeaderCompact = ({ title, subtitle, badge }) => (
  <View style={styles.headerCompact}>
    <View style={{ flex: 1 }}>
      <Text style={styles.headerTitleCompact}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitleCompact}>{subtitle}</Text> : null}
    </View>
    {reportLogo() && (
      <Image src={reportLogo()} style={{ height: 40, marginLeft: 12 }} />
    )}
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </View>
);

export const MetaSection = ({ entity, office, dateStr, userName, extra }) => {
  const displayDate = dateStr || formatDateTime(new Date());
  const orgName = entity || sessionStorage.getItem('muniName') || '';
  const orgRuc = sessionStorage.getItem('muniRuc') || '';
  return (
    <View style={styles.metaSection}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          {orgRuc && <Text style={styles.metaText}>RUC: {orgRuc}</Text>}
          {orgName && <Text style={styles.metaText}>Entidad: {orgName}</Text>}
          {office && <Text style={styles.metaText}>Oficina: {office}</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {userName && <Text style={[styles.metaText, { color: COLORS.SLATE_400 }]}>Usuario: {userName}</Text>}
          <Text style={[styles.metaText, { color: COLORS.SLATE_400 }]}>Fecha: {displayDate}</Text>
          {extra && <Text style={[styles.metaText, { color: COLORS.SLATE_400 }]}>{extra}</Text>}
        </View>
      </View>
    </View>
  );
};

export const TableHeader = ({ columns }) => (
  <View style={styles.tableHeader}>
    {columns.map((col, i) => (
      <View key={i} style={{ width: col.width }}>
        <Text style={styles.tableColHeader}>{col.label}</Text>
      </View>
    ))}
  </View>
);

export const TableRow = ({ children, index }) => (
  <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? COLORS.WHITE : '#f8fafc' }]}>
    {children}
  </View>
);

export const TableCell = ({ width, children }) => (
  <View style={{ width }}>
    <Text style={styles.tableCol}>{children}</Text>
  </View>
);

export const SignatureSection = ({ signatures }) => (
  <View style={styles.signatureSection}>
    {signatures.map((sig, i) => (
      <View key={i} style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>{sig.name}</Text>
        <Text style={{ fontSize: 7, color: COLORS.SLATE_600 }}>{sig.role}</Text>
      </View>
    ))}
  </View>
);

export const Footer = ({ year, entity, generatedDate }) => {
  const muniName = entity || sessionStorage.getItem('muniName') || 'SIPREB';
  const footerDate = generatedDate instanceof Date
    ? generatedDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : generatedDate || new Date().toLocaleDateString('es-PE');

  return (
    <View style={styles.footer}>
      <Text>{muniName} — Sistema Integrado de Patrimonio y Registros</Text>
      <Text>Generado: {footerDate}</Text>
      <Text>\u00a9 {year || new Date().getFullYear()}</Text>
    </View>
  );
};

// ============================================================
// COMPONENTES ESTÁNDAR SBN
// ============================================================

/**
 * Marca de agua con el logo de la municipalidad.
 */
export const Watermark = ({ logo }) => (
  logo ? <Image src={logo} style={styles.watermark} /> : null
);

/**
 * Encabezado estándar: logo a la izquierda, título a la derecha.
 */
export const ReportHeader = ({ logo, title, subtitle, muniName }) => (
  <View style={styles.stdHeader}>
    {logo && <Image src={logo} style={styles.stdHeaderLogo} />}
    <View style={styles.stdHeaderText}>
      <Text style={styles.stdMuniName}>{muniName || reportName() || 'MUNICIPALIDAD'}</Text>
      <Text style={styles.stdReportTitle}>{title}</Text>
      {subtitle && <Text style={styles.stdSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

/**
 * Pie de página estándar SBN.
 */
export const ReportFooter = ({ muniName, year }) => {
  const entity = muniName || reportName() || 'San Luis';
  const currentYear = year || new Date().getFullYear();
  return (
    <View style={styles.stdFooter}>
      <Text>
        Este documento es una representación oficial del Sistema SIPREB. Su validez está sujeta a la normativa interna de la Municipalidad.
      </Text>
      <Text style={{ marginTop: 4 }}>
        © {currentYear} {entity}
      </Text>
    </View>
  );
};

/**
 * Página estándar SBN (envoltorio completo con marca de agua, cabecera y pie).
 * Uso:
 *   <ReportPage logo={...} title="..." muniName="...">
 *     {contenido}
 *   </ReportPage>
 */
export const ReportPage = ({ children, logo, title, subtitle, muniName, year, size = 'A4', orientation, ...rest }) => (
  <Page size={size} orientation={orientation} style={styles.page} {...rest}>
    <Watermark logo={logo} />
    <ReportHeader logo={logo} title={title} subtitle={subtitle} muniName={muniName} />
    {children}
    <ReportFooter muniName={muniName} year={year} />
  </Page>
);

// === LOGO OPTIMIZATION ===

export const loadCompressedLogo = async (maxSize = 80) => {
  const logoUrl = sessionStorage.getItem('muniLogo');
  if (!logoUrl) return null;
  try {
    const resp = await fetch(logoUrl);
    const blob = await resp.blob();
    const img = await createImageBitmap(blob);
    const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const compressed = await canvas.convertToBlob({ type: 'image/png' });
    img.close();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(compressed);
    });
  } catch {
    return null;
  }
};

// === UTILIDADES ===
export const formatDate = (date = new Date()) =>
  date.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

export const formatShortDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date = new Date()) => {
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCurrency = (v) => `S/ ${parseFloat(v || 0).toFixed(2)}`;
