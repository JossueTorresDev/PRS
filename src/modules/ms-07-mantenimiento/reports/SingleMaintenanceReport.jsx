import { Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import { ReportPage, formatCurrency } from "../../../shared/reports";
import { TYPE_LABELS, STATUS_LABELS, WORK_QUALITY_LABELS, ASSET_CONDITION_LABELS, fmtDateTime } from "../utils/reportHelpers";

const TYPE_MAP = Object.fromEntries(
  Object.entries(TYPE_LABELS).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);
const STATUS_MAP = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([k, v]) => [k, typeof v === 'string' ? v : v])
);
const QUALITY_MAP = Object.fromEntries(
  Object.entries(WORK_QUALITY_LABELS).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);
const CONDITION_MAP = Object.fromEntries(
  Object.entries(ASSET_CONDITION_LABELS).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);

const G = {
  text: "#1e293b", sub: "#475569", muted: "#64748b",
  border: "#cbd5e1", line: "#e2e8f0", stripe: "#f8fafc", accent: "#1e3a5f",
};

const S = StyleSheet.create({
  idBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 6, paddingHorizontal: 8,
    borderWidth: 0.5, borderColor: G.border, backgroundColor: G.stripe, marginBottom: 8,
  },
  idCode: { fontSize: 10, fontWeight: "bold", color: G.accent },
  idStatus: { fontSize: 7, color: G.sub, textTransform: "uppercase", letterSpacing: 0.5 },
  idMeta: { fontSize: 7, color: G.muted },

  sec: {
    fontSize: 7.5, fontWeight: "bold", color: G.accent,
    textTransform: "uppercase", letterSpacing: 0.8,
    borderBottomWidth: 0.5, borderBottomColor: G.border,
    paddingBottom: 3, marginTop: 8, marginBottom: 4,
  },
  grid: { flexDirection: "row", marginBottom: 4 },
  lbl: { fontSize: 6, color: G.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1.5 },
  val: { fontSize: 8, color: G.text },

  txtBlock: {
    borderLeftWidth: 2, borderLeftColor: G.border,
    paddingLeft: 7, paddingVertical: 2, marginBottom: 4,
  },
  txtSublbl: { fontSize: 6, color: G.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  txtContent: { fontSize: 8, color: G.sub, lineHeight: 1.5 },

  tHead: {
    flexDirection: "row",
    borderBottomWidth: 0.8, borderBottomColor: G.accent,
    paddingBottom: 3, marginBottom: 1,
  },
  tH: { fontSize: 6, fontWeight: "bold", color: G.accent, textTransform: "uppercase", letterSpacing: 0.3 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: G.line, paddingVertical: 3.5 },
  tRowS: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: G.line, paddingVertical: 3.5, backgroundColor: G.stripe },
  tD: { fontSize: 7.5, color: G.text },
  tDS: { fontSize: 7.5, color: G.sub },

  totalLine: { flexDirection: "row", justifyContent: "flex-end", paddingTop: 5, marginTop: 3, borderTopWidth: 0.8, borderTopColor: G.accent },
  totalLbl: { fontSize: 8.5, fontWeight: "bold", color: G.text, textTransform: "uppercase" },
  totalAmt: { fontSize: 12, fontWeight: "bold", color: G.accent, marginLeft: 12 },

  sigs: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  sigBox: { width: "31%", alignItems: "center" },
  sigLine: { borderTopWidth: 0.5, borderTopColor: G.text, width: "100%", paddingTop: 5, alignItems: "center" },
  sigTit: { fontSize: 6.5, fontWeight: "bold", color: G.text, textAlign: "center", textTransform: "uppercase" },
  sigName: { fontSize: 7, color: G.text, textAlign: "center", marginTop: 3 },
  sigSub: { fontSize: 6, color: G.muted, textAlign: "center", marginTop: 1 },
});

function F({ label, value, w }) {
  return (
    <View style={{ width: w, paddingRight: 8 }}>
      <Text style={S.lbl}>{label}</Text>
      <Text style={S.val} numberOfLines={1}>{value || "—"}</Text>
    </View>
  );
}

function TxtBlock({ label, content }) {
  if (!content) return null;
  return (
    <View style={S.txtBlock}>
      {label ? <Text style={S.txtSublbl}>{label}</Text> : null}
      <Text style={S.txtContent}>{content}</Text>
    </View>
  );
}

const SingleMaintenanceReport = ({
  maintenance, parts = [], history = [],
  hideCosts = false, municipalityLogo, municipalityName,
  boletaImageUrl,
}) => {
  const now = new Date();
  const emitido = now.toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  }) + "  " + now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const partsTotal = parts.reduce(
    (s, p) => s + (parseFloat(p.quantity) || 0) * (parseFloat(p.unitPrice ?? p.unitCost) || 0), 0,
  );
  const laborCost = parseFloat(maintenance?.laborCost || 0) || 0;
  const addCost = parseFloat(maintenance?.additionalCost || 0) || 0;
  const totalCost = parseFloat(maintenance?.totalCost || 0) || laborCost + addCost + partsTotal;

  let n = 0;
  const sec = (t) => { n++; return `${n}. ${t}`; };

  return (
    <Document>
      <ReportPage
        logo={municipalityLogo}
        title={`Ficha de Mantenimiento — ${maintenance?.maintenanceCode || ""}`}
        subtitle={municipalityName || "Sistema Patrimonial SIPREB"}
        muniName={municipalityName}
      >
        <View style={S.idBar}>
          <Text style={S.idCode}>{maintenance?.maintenanceCode || "—"}</Text>
          <Text style={S.idStatus}>{STATUS_MAP[maintenance?.maintenanceStatus] || maintenance?.maintenanceStatus || "—"}</Text>
          <Text style={S.idMeta}>{TYPE_MAP[maintenance?.maintenanceType] || "—"}</Text>
          <Text style={S.idMeta}>Emitido: {emitido}</Text>
        </View>

        <Text style={S.sec}>{sec("Datos del Bien y Orden de Servicio")}</Text>
        <View style={S.grid}>
          <F label="Bien Patrimonial" value={maintenance?._assetName || maintenance?.assetDescription} w="50%" />
          <F label="Código Patrimonial" value={maintenance?.assetCode} w="25%" />
          <F label="Fecha de Finalización" value={fmtDateTime(maintenance?.endDate)} w="25%" />
        </View>
        <View style={S.grid}>
          <F label="Orden de Servicio" value={maintenance?.workOrder} w="50%" />
          <F label="Proveedor" value={maintenance?._supplierName} w="50%" />
        </View>

        <Text style={S.sec}>{sec("Trabajo Realizado")}</Text>
        <TxtBlock content={maintenance?.workDescription || "Sin descripción registrada."} />
        <TxtBlock label="Solución Aplicada" content={maintenance?.appliedSolution} />

        <Text style={S.sec}>{sec("Repuestos y Materiales")}</Text>
        {parts.length > 0 ? (
          <>
            <View style={S.tHead}>
              <Text style={[S.tH, { width: "55%" }]}>Descripción</Text>
              <Text style={[S.tH, { width: "10%" }]}>Cant.</Text>
              {!hideCosts && (
                <>
                  <Text style={[S.tH, { width: "18%" }]}>P. Unit.</Text>
                  <Text style={[S.tH, { width: "17%", textAlign: "right" }]}>Subtotal</Text>
                </>
              )}
            </View>
            {parts.map((p, i) => (
              <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowS}>
                <Text style={[S.tD, { width: "55%" }]} numberOfLines={1}>{p.partName}</Text>
                <Text style={[S.tD, { width: "10%" }]}>{p.quantity}</Text>
                {!hideCosts && (
                  <>
                    <Text style={[S.tDS, { width: "18%" }]}>{formatCurrency(p.unitPrice ?? p.unitCost)}</Text>
                    <Text style={[S.tD, { width: "17%", textAlign: "right" }]}>
                      {formatCurrency((parseFloat(p.quantity) || 0) * (parseFloat(p.unitPrice ?? p.unitCost) || 0))}
                    </Text>
                  </>
                )}
              </View>
            ))}
          </>
        ) : (
          <Text style={{ fontSize: 7.5, color: G.muted, fontStyle: "italic" }}>
            No se registraron repuestos ni materiales.
          </Text>
        )}

        {!hideCosts && (
          <View style={S.totalLine}>
            <Text style={S.totalLbl}>Inversión Total</Text>
            <Text style={S.totalAmt}>{formatCurrency(totalCost)}</Text>
          </View>
        )}

          {history.length > 0 && (
          <>
            <Text style={S.sec}>{sec("Historial de Cambios")}</Text>
            <View style={S.tHead}>
              <Text style={[S.tH, { width: "20%" }]}>Fecha</Text>
              <Text style={[S.tH, { width: "15%" }]}>Estado Anterior</Text>
              <Text style={[S.tH, { width: "15%" }]}>Nuevo Estado</Text>
              <Text style={[S.tH, { width: "50%" }]}>Motivo</Text>
            </View>
            {history.map((h, i) => (
              <View key={i} style={i % 2 === 0 ? S.tRow : S.tRowS}>
                <Text style={[S.tDS, { width: "20%" }]}>{fmtDateTime(h.changedAt)}</Text>
                <Text style={[S.tD, { width: "15%" }]}>{STATUS_MAP[h.previousStatus] || h.previousStatus}</Text>
                <Text style={[S.tD, { width: "15%" }]}>{STATUS_MAP[h.newStatus] || h.newStatus}</Text>
                <Text style={[S.tDS, { width: "50%" }]} numberOfLines={2}>{h.reason || "—"}</Text>
              </View>
            ))}
          </>
        )}

      {(maintenance?.conformityNumber || maintenance?.maintenanceStatus === "CONFIRMED") && (
          <>
            <Text style={S.sec}>{sec("Acta de Conformidad")}</Text>
            <View style={S.grid}>
              <F label="N° de Acta" value={maintenance?.conformityNumber} w="30%" />
              <F label="Calidad del Trabajo" value={QUALITY_MAP[maintenance?.workQuality] || maintenance?.workQuality} w="30%" />
              <F label="Estado Final del Bien" value={CONDITION_MAP[maintenance?.assetConditionAfter] || maintenance?.assetConditionAfter} w="40%" />
            </View>
            {(() => {
              const rf = maintenance?.requiresFollowup;
              const rfBool = rf === true || rf === "true" || rf === "TRUE" || rf === "Sí" || rf === "SI";
              return rfBool && maintenance?.followupDescription ? (
                <TxtBlock label="Seguimiento" content={maintenance.followupDescription} />
              ) : null;
            })()}
          </>
        )}

        {boletaImageUrl && (
          <>
            <Text style={S.sec}>{sec("Comprobante (Boleta / Factura)")}</Text>
            <View style={{ borderWidth: 0.4, borderColor: G.border, borderRadius: 2, marginBottom: 4, padding: 4 }}>
              <Image src={boletaImageUrl} style={{ width: 240, maxHeight: 120, objectFit: "contain", alignSelf: "center" }} />
            </View>
          </>
        )}

        <View style={S.sigs}>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigTit}>Responsable Técnico</Text>
              <Text style={S.sigName}>{maintenance?._responsibleName || "____________________"}</Text>
              <Text style={S.sigSub}>{municipalityName || ""}</Text>
            </View>
          </View>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigTit}>Supervisor / Jefe de Área</Text>
              <Text style={S.sigName}>{maintenance?._supervisorName || "____________________"}</Text>
              <Text style={S.sigSub}>{municipalityName || ""}</Text>
            </View>
          </View>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigTit}>Control Patrimonial</Text>
              <Text style={S.sigName}>{maintenance?.patrimonialControllerName || "____________________"}</Text>
              <Text style={S.sigSub}>{maintenance?.patrimonialControllerDni ? `DNI: ${maintenance.patrimonialControllerDni}` : (municipalityName || "")}</Text>
            </View>
          </View>
        </View>
      </ReportPage>
    </Document>
  );
};

export default SingleMaintenanceReport;
