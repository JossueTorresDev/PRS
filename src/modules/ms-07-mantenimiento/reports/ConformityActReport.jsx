import { Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import { ReportPage } from "../../../shared/reports";
import { TYPE_LABELS, WORK_QUALITY_LABELS, ASSET_CONDITION_LABELS } from "../utils/reportHelpers";

const TYPE_MAP = Object.fromEntries(
  Object.entries(TYPE_LABELS).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);
const QUALITY_MAP = Object.fromEntries(
  Object.entries(WORK_QUALITY_LABELS).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);
const CONDITION_MAP = Object.fromEntries(
  Object.entries(ASSET_CONDITION_LABELS).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);

const G = {
  text: "#1e293b", sub: "#475569", muted: "#64748b",
  border: "#94a3b8", line: "#e2e8f0", stripe: "#f8fafc", accent: "#1e3a5f",
};

const S = StyleSheet.create({
  actaTitulo: {
    fontSize: 10, fontWeight: "bold", color: G.accent,
    textAlign: "center", textTransform: "uppercase", letterSpacing: 0.6,
    marginTop: 4, marginBottom: 2,
  },
  actaRef: { fontSize: 7.5, color: G.sub, textAlign: "center", marginBottom: 8 },
  parrafo: {
    fontSize: 8, color: G.sub, textAlign: "justify", lineHeight: 1.55, marginBottom: 6,
  },
  negrita: { fontWeight: "bold", color: G.text },

  sec: {
    fontSize: 7.5, fontWeight: "bold", color: G.accent,
    textTransform: "uppercase", letterSpacing: 0.7,
    borderBottomWidth: 0.5, borderBottomColor: G.border,
    paddingBottom: 3, marginTop: 8, marginBottom: 4,
  },

  tbl: { borderWidth: 0.4, borderColor: G.border, marginBottom: 6 },
  tblRow: { flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: G.line },
  tblRowLast: { flexDirection: "row" },
  tblLbl: {
    paddingVertical: 5, paddingHorizontal: 6,
    fontSize: 7, fontWeight: "bold", color: G.sub,
    borderRightWidth: 0.4, borderRightColor: G.line, backgroundColor: G.stripe,
  },
  tblVal: {
    paddingVertical: 5, paddingHorizontal: 6,
    fontSize: 7.5, color: G.text,
    borderRightWidth: 0.4, borderRightColor: G.line,
  },
  tblValEnd: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 7.5, color: G.text },

  rTbl: { borderWidth: 0.4, borderColor: G.border, marginBottom: 6 },
  rTHead: {
    flexDirection: "row",
    borderBottomWidth: 0.6, borderBottomColor: G.accent, backgroundColor: G.stripe,
  },
  rTH: {
    paddingVertical: 4, paddingHorizontal: 6,
    fontSize: 6.5, fontWeight: "bold", color: G.accent,
    textTransform: "uppercase", letterSpacing: 0.3,
  },
  rTRow: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: G.line },
  rTRowLast: { flexDirection: "row" },
  rTD: { paddingVertical: 4, paddingHorizontal: 6, fontSize: 7.5, color: G.text },

  textBox: {
    borderWidth: 0.4, borderColor: G.border,
    padding: 7, minHeight: 36, marginBottom: 6,
  },
  textBoxTxt: { fontSize: 8, color: G.sub, lineHeight: 1.5 },

  sigSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  sigBox: { width: "31%", alignItems: "center" },
  sigImg: { width: 58, height: 28, marginBottom: 4 },
  sigLine: { borderTopWidth: 0.5, borderTopColor: G.text, width: "100%", paddingTop: 5, alignItems: "center" },
  sigTit: { fontSize: 6.5, fontWeight: "bold", color: G.text, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.3 },
  sigName: { fontSize: 7.5, color: G.text, textAlign: "center", marginTop: 3, fontWeight: "bold" },
  sigSub: { fontSize: 6.5, color: G.muted, textAlign: "center", marginTop: 1 },
});

function R4({ l1, v1, l2, v2, last }) {
  const RS = last ? S.tblRowLast : S.tblRow;
  return (
    <View style={RS}>
      <Text style={[S.tblLbl, { width: "25%" }]}>{l1}</Text>
      <Text style={[S.tblVal, { width: "25%" }]} numberOfLines={1}>{v1 || "—"}</Text>
      <Text style={[S.tblLbl, { width: "25%" }]}>{l2}</Text>
      <Text style={[S.tblValEnd, { width: "25%" }]} numberOfLines={1}>{v2 || "—"}</Text>
    </View>
  );
}
function R1x3({ l1, v1, last }) {
  const RS = last ? S.tblRowLast : S.tblRow;
  return (
    <View style={RS}>
      <Text style={[S.tblLbl, { width: "25%" }]}>{l1}</Text>
      <Text style={[S.tblValEnd, { width: "75%" }]} numberOfLines={2}>{v1 || "—"}</Text>
    </View>
  );
}

const ConformityActReport = ({
  maintenance, conformity, parts = [], asset, supplier, municipality,
  userAreaResponsible, place = "[Distrito/Provincia]",
  municipalityLogo, officeName = "Oficina de Control Patrimonial / Unidad de Logística",
}) => {
  const now = new Date();
  const dia = now.getDate();
  const mes = now.toLocaleDateString("es-PE", { month: "long" });
  const anio = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const minu = String(now.getMinutes()).padStart(2, "0");

  const muniName = municipality?.name || municipality?.nombre || "[MUNICIPALIDAD]";
  const conformityNum = conformity?.conformityNumber || maintenance?.conformityNumber || `[N°]-${anio}`;
  const qualityLabel = QUALITY_MAP[conformity?.workQuality || maintenance?.workQuality] || conformity?.workQuality || maintenance?.workQuality || "—";
  const condLabel = CONDITION_MAP[conformity?.assetConditionAfter || maintenance?.assetConditionAfter] || conformity?.assetConditionAfter || maintenance?.assetConditionAfter || "—";
  const followup = conformity?.requiresFollowup || maintenance?.requiresFollowup;
  const followupBool = followup === true || followup === "true" || followup === "TRUE" || followup === "Sí" || followup === "SI";
  const followupDesc = conformity?.followupDescription || maintenance?.followupDescription;
  const workDone = conformity?.appliedSolution || maintenance?.appliedSolution;
  const hasRepuestos = parts && parts.length > 0;

  const firm1Name = conformity?.supplierRepresentativeName || "____________________";
  const firm1Dni = conformity?.supplierRepresentativeDni || "—";
  const firm2Name = conformity?.userAreaResponsibleName || userAreaResponsible?.name || "____________________";
  const firm2Pos = conformity?.userAreaResponsiblePosition || userAreaResponsible?.position || "—";
  const firm2Dni = conformity?.userAreaResponsibleDni || userAreaResponsible?.dni || "—";
  const firm3Name = conformity?.patrimonialControllerName || "____________________";
  const firm3Dni = conformity?.patrimonialControllerDni || "—";

  let sn = 0;
  const nxt = (t) => { sn++; return `${sn}. ${t}`; };

  return (
    <Document>
      <ReportPage
        logo={municipalityLogo}
        title={`Acta de Conformidad N° ${conformityNum}`}
        subtitle={`${muniName.toUpperCase()} — ${officeName}`}
        muniName={muniName}
      >
        <Text style={S.actaTitulo}>Acta de Conformidad de Servicio de Mantenimiento</Text>
        <Text style={S.actaRef}>N° {conformityNum}</Text>

        <Text style={S.parrafo}>
          En {place}, siendo las {hh}:{minu} horas del día {dia} de {mes} de {anio},
          los suscritos representantes de la empresa proveedora del servicio,
          del área usuaria y de la Unidad de Control Patrimonial se reúnen para
          suscribir la presente Acta de Conformidad, de acuerdo con los
          lineamientos de la Superintendencia Nacional de Bienes Estatales (SBN)
          y la normativa municipal vigente.
        </Text>

        <Text style={S.sec}>{nxt("Datos Generales de la Orden de Servicio")}</Text>
        <View style={S.tbl}>
          <R4 l1="Orden de Servicio N°:" v1={maintenance?.workOrder} l2="Tipo de Mantenimiento:" v2={TYPE_MAP[maintenance?.maintenanceType] || maintenance?.maintenanceType || "—"} />
          <R1x3 l1="Razón Social del Proveedor:" v1={supplier?.legalName || supplier?.tradeName || supplier?.razonSocial || "—"} />
          <R4 last l1="RUC del Proveedor:" v1={supplier?.ruc || supplier?.numeroDocumento || maintenance?.supplierRuc || "—"} l2="Plazo de Ejecución:" v2={maintenance?.executionDays ? `${maintenance.executionDays} día(s) calendario` : "—"} />
        </View>

        <Text style={S.sec}>{nxt("Identificación del Bien Patrimonial")}</Text>
        <View style={S.tbl}>
          <R1x3 last l1="Código Patrimonial:" v1={asset?.assetCode || maintenance?.assetCode || "—"} />
          <R1x3 last l1="Denominación del Bien:" v1={asset?.description || asset?.descripcion || maintenance?.assetDescription || "—"} />
        </View>

        <Text style={S.sec}>{nxt("Descripción de los Trabajos Realizados")}</Text>
        <View style={S.textBox}>
          <Text style={S.textBoxTxt}>
            {workDone || "Describir brevemente los servicios prestados, cambio de repuestos, lubricantes o reparaciones efectuadas conforme a los términos de referencia."}
          </Text>
        </View>

        {hasRepuestos && (
          <>
            <Text style={S.sec}>{nxt("Repuestos y Materiales Utilizados")}</Text>
            <View style={S.rTbl}>
              <View style={S.rTHead}>
                <Text style={[S.rTH, { width: "55%" }]}>Descripción del Repuesto / Material</Text>
                <Text style={[S.rTH, { width: "10%" }]}>Cant.</Text>
                <Text style={[S.rTH, { width: "35%", textAlign: "right" }]}>Costo Total</Text>
              </View>
              {parts.map((p, i) => (
                <View key={i} style={i < parts.length - 1 ? S.rTRow : S.rTRowLast}>
                  <Text style={[S.rTD, { width: "55%" }]} numberOfLines={1}>{p.partName}</Text>
                  <Text style={[S.rTD, { width: "10%", textAlign: "center" }]}>{p.quantity}</Text>
                  <Text style={[S.rTD, { width: "35%", textAlign: "right" }]}>
                    S/ {((parseFloat(p.quantity) || 0) * (parseFloat(p.unitPrice ?? p.unitCost) || 0)).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={S.sec}>{nxt("Evaluación del Servicio Recibido")}</Text>
        <View style={S.tbl}>
          <R4 l1="Calidad del Trabajo:" v1={qualityLabel} l2="Estado Final del Bien:" v2={condLabel} />
          <R4 last l1="Requiere Seguimiento:" v1={followupBool ? "Sí" : "No"} l2="" v2="" />
        </View>
        {followupBool && followupDesc && (
          <View style={[S.textBox, { minHeight: 24 }]}>
            <Text style={[S.textBoxTxt, { fontStyle: "italic" }]}>{followupDesc}</Text>
          </View>
        )}

        <Text style={S.sec}>{nxt("Declaración de Conformidad")}</Text>
        <Text style={S.parrafo}>
          Luego de la verificación técnica y operativa del bien patrimonial detallado
          en la presente acta, los suscritos manifiestan su{" "}
          <Text style={S.negrita}>CONFORMIDAD</Text> con el servicio recibido,
          dejando expresa constancia de que el mismo cumple con las especificaciones
          técnicas, condiciones y términos establecidos en la orden de servicio
          correspondiente, de conformidad con la normativa de la SBN y los
          procedimientos internos de la municipalidad.
        </Text>

        <View style={S.sigSection}>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigTit}>Representante del Proveedor</Text>
              <Text style={S.sigName}>{firm1Name}</Text>
              <Text style={S.sigSub}>DNI / RUC: {firm1Dni}</Text>
            </View>
          </View>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigTit}>Responsable del Área Usuaria</Text>
              <Text style={S.sigName}>{firm2Name}</Text>
              <Text style={S.sigSub}>{firm2Pos}</Text>
              <Text style={S.sigSub}>DNI: {firm2Dni}</Text>
            </View>
          </View>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigTit}>Control Patrimonial / Logística</Text>
              <Text style={S.sigName}>{firm3Name}</Text>
              <Text style={S.sigSub}>DNI: {firm3Dni}</Text>
            </View>
          </View>
        </View>

        {conformity?.digitalSignature && (
          <View style={{ marginTop: 16, borderTopWidth: 0.4, borderTopColor: G.border, paddingTop: 8 }}>
            <Text style={{ fontSize: 7, fontWeight: "bold", color: G.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              Firma Digital (para desencriptar)
            </Text>
            {conformity.digitalSignature.startsWith("data:image") ? (
              <Image src={conformity.digitalSignature} style={{ width: 120, height: 50, marginTop: 4 }} />
            ) : (
              <Text style={{ fontSize: 5.5, color: G.muted, fontFamily: "Courier", wordBreak: "break-all" }}>
                {conformity.digitalSignature}
              </Text>
            )}
          </View>
        )}
      </ReportPage>
    </Document>
  );
};

export default ConformityActReport;
