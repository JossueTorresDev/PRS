
import React, { useState, useEffect } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ReportPage, loadCompressedLogo } from '../../../shared/reports';


const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },


  // Header
  header: {
    marginBottom: 16,
    backgroundColor: '#0f2847',
    padding: 18,
    marginLeft: -20,
    marginRight: -20,
    marginTop: -20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#d4af37',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 3,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#b0c4de',
    fontStyle: 'italic',
  },
  headerNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#3d5a80',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    textAlign: 'center',
  },

  logo: { width: 72, height: 72, marginBottom: 6, objectFit: 'contain' },


  // Section
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 7,
    color: '#ffffff',
    backgroundColor: '#0f2847',
    padding: 8,
    borderRadius: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#d4af37',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'justify',
    lineHeight: 1.5,
    color: '#2c3e50',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0f2847',
  },


  // Info box
  infoBox: {
    marginBottom: 7,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 7,
    paddingBottom: 7,
    borderLeftWidth: 5,
    borderLeftColor: '#d4af37',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    border: '1px solid #e0e6ed',
  },
  infoLine: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.3,
    color: '#2c3e50',
  },


  // Table
  table: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0d7e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f2847',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
    minHeight: 22,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableColHeader: {
    padding: 7,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#0f2847',
  },
  tableCol: {
    padding: 7,
    fontSize: 9,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e8ecf1',
    color: '#2c3e50',
  },
  tableColLast: {
    borderRightWidth: 0,
  },


  // Total row
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#0f2847',
    borderTopWidth: 2,
    borderTopColor: '#d4af37',
    minHeight: 22,
  },
  totalCol: {
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0f2847',
  },


  // Signatures
  signatureSection: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#d0d7e0',
  },
  signatureBox: {
    width: '48%',
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 2,
    borderTopColor: '#0f2847',
    marginTop: 6,
    paddingTop: 0,
    paddingBottom: 0,
    textAlign: 'center',
    fontSize: 9,
    width: '100%',
    minHeight: 14,
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f2847',
  },
  signatureName: {
    fontSize: 9,
    marginTop: 0,
    marginBottom: 6,
    color: '#0f2847',
    fontWeight: 'bold',
  },


  // Digital signature
  digitalSignature: {
    marginBottom: 7,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 7,
    paddingBottom: 7,
    borderLeftWidth: 5,
    borderLeftColor: '#d4af37',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  signatureCheckmark: {
    width: 18,
    height: 18,
    marginRight: 8,
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 14,
  },
  signatureContent: {
    flex: 1,
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f2847',
    marginBottom: 1,
  },
  signatureDetail: {
    fontSize: 9,
    color: '#2c3e50',
    marginBottom: 0.5,
    lineHeight: 1.2,
  },


  // Footer
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    fontSize: 8,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#d0d7e0',
    paddingTop: 6,
    color: '#7f8c8d',
  },
});


const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} p. m. del día ${day} de ${getMonthName(month)} de ${year}`;
};


const getMonthName = (month) => {
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return months[month - 1];
};


const HandoverReceiptDetailReport = ({ receipt, getUsernameById }) => {
  const totalValue = (receipt?.assets || []).reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
  const totalUnits = (receipt?.assets || []).reduce((sum, a) => sum + (parseInt(a.quantity, 10) || 1), 0);
  const [logo, setLogo] = useState(null);
  useEffect(() => {
    let mounted = true;
    loadCompressedLogo(80).then(l => { if (mounted) setLogo(l); }).catch(() => {});
    return () => { mounted = false; };
  }, []);



  return (
    <Document>
      {/* PRIMERA PÁGINA - DATOS GENERALES */}
      <ReportPage logo={logo} title="ACTA DE ENTREGA-RECEPCIÓN" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName="Municipalidad de San Luis">

        <View style={{ position: 'absolute', top: 18, right: 20 }}>
          <Text style={styles.headerNumber}>{receipt?.receiptNumber || 'ACT-XXXX-XXXX'}</Text>
        </View>

        {/* GENERADOR */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            El presente acto es generado por <Text style={styles.boldText}>{getUsernameById(receipt?.generatedBy)}</Text>, en representación del Sistema Patrimonial de Registro de Bienes – SIPREB.
          </Text>
        </View>


        {/* FECHA Y LUGAR */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Siendo las <Text style={styles.boldText}>{fmtDateTime(receipt?.createdAt)}</Text>, en las instalaciones de la <Text style={styles.boldText}>Municipalidad de San Luis</Text>, específicamente en la <Text style={styles.boldText}>Gerencia Municipal</Text>, se reúnen las siguientes personas:
          </Text>
        </View>


        {/* PARTICIPANTES */}
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLine}>
              <Text style={styles.boldText}>Responsable de la entrega:</Text> {getUsernameById(receipt?.deliveringResponsibleId)}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.boldText}>Responsable de la recepción:</Text> {getUsernameById(receipt?.receivingResponsibleId)}
            </Text>
            {receipt?.witness1Id && (
              <Text style={styles.infoLine}>
                <Text style={styles.boldText}>Testigos:</Text> {getUsernameById(receipt?.witness1Id)}{receipt?.witness2Id ? ` y ${getUsernameById(receipt?.witness2Id)}` : ''}
              </Text>
            )}
          </View>
        </View>


        {/* PROPÓSITO */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            La reunión tiene como finalidad proceder a la entrega y recepción de los bienes patrimoniales registrados en el Sistema Patrimonial de Registro de Bienes – SIPREB, correspondientes a la entidad <Text style={styles.boldText}>Municipalidad de San Luis</Text>.
          </Text>
        </View>


        {/* OBSERVACIONES Y CONDICIONES */}
        {(receipt?.deliveryObservations || receipt?.receptionObservations || receipt?.specialConditions) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVACIONES Y CONDICIONES</Text>
            {receipt?.deliveryObservations && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLine}>
                  <Text style={styles.boldText}>Observaciones de entrega:</Text> {receipt.deliveryObservations}
                </Text>
              </View>
            )}
            {receipt?.receptionObservations && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLine}>
                  <Text style={styles.boldText}>Observaciones de recepción:</Text> {receipt.receptionObservations}
                </Text>
              </View>
            )}
            {receipt?.specialConditions && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLine}>
                  <Text style={styles.boldText}>Condiciones especiales:</Text> {receipt.specialConditions}
                </Text>
              </View>
            )}
          </View>
        )}


        {/* CONFORMIDAD */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Habiendo verificado la conformidad de las condiciones del proceso de entrega y recepción, y estando ambas partes de acuerdo, se procede a firmar la presente acta en señal de conformidad.
          </Text>
        </View>


        {/* ESTADO DE FIRMAS */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>ESTADO DE FIRMAS</Text>
         
          {receipt?.deliverySignatureDate && (
            <View style={styles.digitalSignature}>
              <Text style={styles.signatureCheckmark}>✓</Text>
              <View style={styles.signatureContent}>
                <Text style={styles.signatureTitle}>Firmado digitalmente por:</Text>
                <Text style={styles.signatureDetail}>{getUsernameById(receipt?.deliveringResponsibleId)}</Text>
                <Text style={styles.signatureDetail}>Responsable de la entrega</Text>
                <Text style={styles.signatureDetail}>Fecha: {fmtDateTime(receipt?.deliverySignatureDate)}</Text>
              </View>
            </View>
          )}


          {receipt?.receptionSignatureDate && (
            <View style={styles.digitalSignature}>
              <Text style={styles.signatureCheckmark}>✓</Text>
              <View style={styles.signatureContent}>
                <Text style={styles.signatureTitle}>Firmado digitalmente por:</Text>
                <Text style={styles.signatureDetail}>{getUsernameById(receipt?.receivingResponsibleId)}</Text>
                <Text style={styles.signatureDetail}>Responsable de la recepción</Text>
                <Text style={styles.signatureDetail}>Fecha: {fmtDateTime(receipt?.receptionSignatureDate)}</Text>
              </View>
            </View>
          )}


          {!receipt?.deliverySignatureDate && !receipt?.receptionSignatureDate && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLine}>
                <Text style={styles.boldText}>Estado:</Text> Pendiente de firmas
              </Text>
            </View>
          )}
        </View>



        {/* Footer provided by ReportPage (ReportFooter) */}
      </ReportPage>


      {/* SEGUNDA PÁGINA - BIENES PATRIMONIALES */}
      <ReportPage logo={logo} title="BIENES PATRIMONIALES" subtitle="Sistema Patrimonial de Registro de Bienes — SIPREB" muniName="Municipalidad de San Luis">

        <View style={{ position: 'absolute', top: 18, right: 20 }}>
          <Text style={styles.headerNumber}>{receipt?.receiptNumber || 'ACT-XXXX-XXXX'}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={{ width: '5%' }}><Text style={styles.tableColHeader}>Nº</Text></View>
              <View style={{ width: '20%' }}><Text style={styles.tableColHeader}>CÓDIGO</Text></View>
              <View style={{ width: '60%' }}><Text style={styles.tableColHeader}>DESCRIPCIÓN</Text></View>
              <View style={{ width: '15%' }}><Text style={[styles.tableColHeader, styles.tableColLast]}>CANTIDAD</Text></View>
            </View>


            {receipt?.assets && receipt.assets.length > 0 ? (
              receipt.assets.map((asset, idx) => (
                <View key={`${asset.id}-${idx}`} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <View style={{ width: '5%' }}><Text style={styles.tableCol}>{idx + 1}</Text></View>
                  <View style={{ width: '20%' }}><Text style={styles.tableCol}>{asset.assetCode || '—'}</Text></View>
                  <View style={{ width: '60%' }}><Text style={styles.tableCol}>{asset.assetDescription || asset.description || '—'}</Text></View>
                  <View style={{ width: '15%' }}><Text style={[styles.tableCol, styles.tableColLast]}>{asset.quantity || 1}</Text></View>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <View style={{ width: '100%' }}><Text style={styles.tableCol}>No hay bienes registrados</Text></View>
              </View>
            )}


            <View style={styles.totalRow}>
              <View style={{ width: '85%' }}><Text style={[styles.totalCol, { textAlign: 'right' }]}>TOTAL</Text></View>
              <View style={{ width: '15%' }}><Text style={[styles.totalCol, styles.tableColLast]}>{totalUnits}</Text></View>
            </View>
          </View>
        </View>


        {/* Footer provided by ReportPage (ReportFooter) */}
      </ReportPage>
    </Document>
  );
};


export default HandoverReceiptDetailReport;


