import { Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import { ReportPage, formatCurrency } from "../../../shared/reports";
import { TYPE_LABELS, STATUS_LABELS, fmtDate } from "../utils/reportHelpers";

const TYPE_MAP = Object.fromEntries(
  Object.entries(TYPE_LABELS).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);
const STATUS_MAP = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([k, v]) => [k, typeof v === 'string' ? v : v])
);
const STATUS_ORDER = [
  "SCHEDULED", "IN_PROCESS", "PENDING_CONFORMITY",
  "CONFIRMED", "SUSPENDED", "CANCELLED",
];

const G = {
  text: "#1e293b", sub: "#475569", muted: "#64748b",
  border: "#cbd5e1", line: "#e2e8f0", stripe: "#f8fafc", accent: "#1e3a5f",
};

const S = StyleSheet.create({
  topBar: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: 10, paddingBottom: 6,
    borderBottomWidth: 0.5, borderBottomColor: G.border,
  },
  topLbl: { fontSize: 6, color: G.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  topVal: { fontSize: 9, color: G.text, fontWeight: "bold" },

  tHead: {
    flexDirection: "row",
    borderBottomWidth: 0.8, borderBottomColor: G.accent,
    paddingBottom: 3, marginBottom: 1,
  },
  tH: { fontSize: 6, fontWeight: "bold", color: G.accent, textTransform: "uppercase", letterSpacing: 0.3, paddingRight: 4 },
  tRow: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: G.line, paddingVertical: 4 },
  tRowS: { flexDirection: "row", borderBottomWidth: 0.3, borderBottomColor: G.line, paddingVertical: 4, backgroundColor: G.stripe },
  tD: { fontSize: 7, color: G.text, paddingRight: 4 },
  tDS: { fontSize: 7, color: G.sub, paddingRight: 4 },

  resSec: {
    fontSize: 7.5, fontWeight: "bold", color: G.accent,
    textTransform: "uppercase", letterSpacing: 0.8,
    borderBottomWidth: 0.5, borderBottomColor: G.border,
    paddingBottom: 3, marginTop: 10, marginBottom: 5,
  },
  cntGrid: { flexDirection: "row", marginBottom: 6 },
  cntItem: {
    flex: 1, paddingVertical: 4, paddingHorizontal: 5,
    borderRightWidth: 0.3, borderRightColor: G.line,
  },
  cntItemLast: { flex: 1, paddingVertical: 4, paddingHorizontal: 5 },
  cntLbl: { fontSize: 5.5, color: G.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  cntN: { fontSize: 13, fontWeight: "bold", color: G.accent },

  totalBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 0.8, borderTopColor: G.accent, paddingTop: 5,
  },
  totalLbl: { fontSize: 8, fontWeight: "bold", color: G.text, textTransform: "uppercase" },
  totalVal: { fontSize: 12, fontWeight: "bold", color: G.accent },

  sigs: { flexDirection: "row", justifyContent: "space-around", marginTop: 28 },
  sigBox: { width: "40%", alignItems: "center" },
  sigLine: { borderTopWidth: 0.5, borderTopColor: G.text, width: "100%", paddingTop: 5, alignItems: "center" },
  sigName: { fontSize: 8, fontWeight: "bold", color: G.text, textAlign: "center" },
  sigRole: { fontSize: 6.5, color: G.muted, textAlign: "center", marginTop: 2 },
});

const MaintenanceReport = ({ maintenances = [], municipalityLogo, municipalityName }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit",
  });
  const emitido = `${dateStr} ${timeStr}`;

  const conteo = {};
  for (const s of STATUS_ORDER) conteo[s] = 0;
  for (const m of maintenances) {
    const st = m.maintenanceStatus || "SCHEDULED";
    if (conteo[st] !== undefined) conteo[st]++;
  }

  const totalInv = maintenances.reduce(
    (a, m) => a + (parseFloat(m.totalCost ?? m.costoTotal) || 0), 0,
  );

  return (
    <Document>
      <ReportPage
        logo={municipalityLogo}
        title="Reporte General de Mantenimientos"
        subtitle={municipalityName || "Sistema Patrimonial SIPREB"}
        muniName={municipalityName}
      >
        <View style={S.topBar}>
          <View>
            <Text style={S.topLbl}>Módulo</Text>
            <Text style={S.topVal}>Control de Mantenimiento y Reparación</Text>
          </View>
          <View>
            <Text style={S.topLbl}>Fecha de Emisión</Text>
            <Text style={S.topVal}>{emitido}</Text>
          </View>
          <View>
            <Text style={S.topLbl}>Total de Registros</Text>
            <Text style={S.topVal}>{maintenances.length}</Text>
          </View>
        </View>

        <View style={S.tHead}>
          <Text style={[S.tH, { width: "3%" }]}>N°</Text>
          <Text style={[S.tH, { width: "20%" }]}>Código</Text>
          <Text style={[S.tH, { width: "30%" }]}>Activo Patrimonial</Text>
          <Text style={[S.tH, { width: "10%" }]}>Tipo</Text>
          <Text style={[S.tH, { width: "12%" }]}>Estado</Text>
          <Text style={[S.tH, { width: "10%" }]}>Fecha Prog.</Text>
          <Text style={[S.tH, { width: "10%", textAlign: "right" }]}>Total S/.</Text>
        </View>

        {maintenances.map((m, i) => (
          <View key={m.id || i} style={i % 2 === 0 ? S.tRow : S.tRowS}>
            <Text style={[S.tDS, { width: "3%" }]}>{i + 1}</Text>
            <Text style={[S.tD, { width: "20%", fontWeight: "bold" }]} numberOfLines={1}>
              {m.maintenanceCode || "—"}
            </Text>
            <Text style={[S.tD, { width: "30%" }]} numberOfLines={1}>
              {m._assetName || m.assetDescription || "—"}
            </Text>
            <Text style={[S.tDS, { width: "10%" }]} numberOfLines={1}>
              {TYPE_MAP[m.maintenanceType] || "—"}
            </Text>
            <Text style={[S.tD, { width: "12%" }]} numberOfLines={1}>
              {STATUS_MAP[m.maintenanceStatus] || "—"}
            </Text>
            <Text style={[S.tDS, { width: "10%" }]}>{fmtDate(m.scheduledDate)}</Text>
            <Text style={[S.tD, { width: "10%", textAlign: "right" }]}>
              {formatCurrency(m.totalCost || m.costoTotal || 0)}
            </Text>
          </View>
        ))}

        <Text style={S.resSec}>Resumen por Estado</Text>
        <View style={S.cntGrid}>
          {STATUS_ORDER.map((key, i, arr) => (
            <View key={key} style={i < arr.length - 1 ? S.cntItem : S.cntItemLast}>
              <Text style={S.cntLbl}>{STATUS_MAP[key]}</Text>
              <Text style={S.cntN}>{conteo[key] || 0}</Text>
            </View>
          ))}
        </View>

        <View style={S.totalBar}>
          <Text style={S.totalLbl}>
            Total: {maintenances.length} registro{maintenances.length !== 1 ? "s" : ""}
          </Text>
          <Text style={S.totalVal}>Inversión Total: {formatCurrency(totalInv)}</Text>
        </View>

        <View style={S.sigs}>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigName}>____________________</Text>
              <Text style={S.sigRole}>Responsable de Mantenimiento</Text>
              <Text style={[S.sigRole, { fontSize: 6 }]}>{municipalityName || ""}</Text>
            </View>
          </View>
          <View style={S.sigBox}>
            <View style={S.sigLine}>
              <Text style={S.sigName}>____________________</Text>
              <Text style={S.sigRole}>Jefe de Área / Control Patrimonial</Text>
              <Text style={[S.sigRole, { fontSize: 6 }]}>{municipalityName || ""}</Text>
            </View>
          </View>
        </View>
      </ReportPage>
    </Document>
  );
};

export default MaintenanceReport;
