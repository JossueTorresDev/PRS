import React, { useEffect, useState } from "react";
import siprebLogo from "../components/sistema/logo-sipreb.png";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";
import {
    MetaSection,
    Footer,
    COLORS,
    formatDateTime,
} from "../../../shared/reports";
import { getMunicipalidadById } from "../../ms-01-tenant-management/services/municipalidadService.js";
import { getMunicipalityId } from "../../../shared/utils/municipalityHelper.js";

const formatValue = (value) => {
    if (value === null || value === undefined) return "—";

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return value.toString();
};

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: "Helvetica",
        backgroundColor: COLORS.WHITE,
    },
    reportHeader: {
        backgroundColor: COLORS.NAVY,
        margin: -30,
        marginBottom: 30,
        padding: 30,
        paddingBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    reportHeaderText: {
        flex: 1,
        marginRight: 12,
    },
    reportHeaderTitle: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    reportHeaderSubtitle: {
        color: "#cbd5e1",
        fontSize: 9,
        marginTop: 4,
    },
    logoContainer: {
        width: 150,
        height: 54,
        backgroundColor: COLORS.WHITE,
        borderRadius: 10,
        padding: 6,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 0.5,
        borderColor: COLORS.SLATE_200,
    },
    logo: {
        width: 138,
        height: 42,
        objectFit: "contain",
    },
    summaryText: {
        marginTop: 8,
        fontSize: 9,
        color: COLORS.SLATE_600,
        marginBottom: 8,
    },
    table: {
        display: "table",
        width: "auto",
        marginTop: 10,
        border: "1px solid #ddd",
    },
    row: {
        flexDirection: "row",
    },

    headerCell: {
        backgroundColor: COLORS.NAVY,
        color: COLORS.WHITE,
        fontWeight: "bold",
        padding: 5,
        fontSize: 9,
        borderRight: "1px solid #fff",
    },

    cell: {
        padding: 5,
        fontSize: 9,
        color: COLORS.SLATE_800,
        borderBottom: "1px solid #eee",
    },

    active: {
        color: "green",
        fontWeight: "bold",
    },
    inactive: {
        color: "gray",
    },

    footer: {
        marginTop: 20,
        borderTop: "1px solid #ccc",
        paddingTop: 5,
        textAlign: "right",
        fontSize: 9,
        color: "gray",
    },
});

const SystemConfigReport = ({ configs, entity = 'Municipalidad' }) => {
    const [municipalityName, setMunicipalityName] = useState(entity);

    useEffect(() => {
        const loadMunicipalityName = async () => {
            const municipalityId = getMunicipalityId();
            if (!municipalityId) return;

            try {
                const municipality = await getMunicipalidadById(municipalityId);
                setMunicipalityName(municipality.nombre || municipality.name || entity);
            } catch {
                setMunicipalityName(entity);
            }
        };
        loadMunicipalityName();
    }, [entity]);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.reportHeader}>
                    <View style={styles.reportHeaderText}>
                        <Text style={styles.reportHeaderTitle}>Reporte de Configuraciones del Sistema</Text>
                        <Text style={styles.reportHeaderSubtitle}>Parámetros y Configuración Global</Text>
                    </View>
                    <View style={styles.logoContainer}>
                        <Image src={siprebLogo} style={styles.logo} />
                    </View>
                </View>

                <MetaSection
                    entity={municipalityName}
                    office="Gestión de Configuración del Sistema"
                    dateStr={formatDateTime(new Date())}
                />
                <Text style={styles.summaryText}>Total de registros: {configs.length}</Text>

                <View style={styles.table}>

                    <View style={styles.row}>
                        <Text style={[styles.headerCell, { width: "20%" }]}>Categoría</Text>
                        <Text style={[styles.headerCell, { width: "20%" }]}>Clave</Text>
                        <Text style={[styles.headerCell, { width: "20%" }]}>Valor</Text>
                        <Text style={[styles.headerCell, { width: "15%" }]}>Tipo</Text>
                        <Text style={[styles.headerCell, { width: "15%" }]}>Editable</Text>
                        <Text style={[styles.headerCell, { width: "10%" }]}>Reinicio</Text>
                    </View>

                    {configs.map((c) => (
                        <View style={styles.row} key={c.id}>
                            <Text style={[styles.cell, { width: "20%" }]}>
                                {c.category}
                            </Text>
                            <Text style={[styles.cell, { width: "20%" }]}>
                                {c.key}
                            </Text>
                            <Text style={[styles.cell, { width: "20%" }]}>
                                {formatValue(c.value)}
                            </Text>
                            <Text style={[styles.cell, { width: "15%" }]}>
                                {c.dataType}
                            </Text>
                            <Text
                                style={[
                                    styles.cell,
                                    { width: "15%" },
                                    c.isEditable ? styles.active : styles.inactive,
                                ]}
                            >
                                {c.isEditable ? "Sí" : "No"}
                            </Text>
                            <Text style={[styles.cell, { width: "10%" }]}>
                                {c.requiresRestart ? "Sí" : "No"}
                            </Text>
                        </View>
                    ))}
                </View>

                <Footer year={new Date().getFullYear()} entity={municipalityName} />
            </Page>
        </Document>
    );
};

export default SystemConfigReport;