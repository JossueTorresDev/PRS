import jsPDF from 'jspdf';

/**
 * Servicio para generar Reporte Gerencial Consolidado en PDF
 * Usando solo jsPDF nativo (sin autotable) para evitar errores de dependencia.
 */
export async function generateConsolidatedPdf(stats, municipalityName = 'MUNICIPALIDAD DISTRITAL') {
    const doc = jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [30, 41, 59]; // Slate-800

    // ─── Header ──────────────────────────────────────────────
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SIPREB', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA DE GESTIÓN PATRIMONIAL', 15, 28);

    doc.setFontSize(14);
    doc.text('REPORTE GERENCIAL CONSOLIDADO', 115, 20);
    doc.setFontSize(8);
    doc.text(municipalityName.toUpperCase(), 115, 28);

    // ─── Info General ────────────────────────────────────────
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA DE EMISIÓN:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleString('es-PE'), 55, 55);

    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO GLOBAL:', 15, 62);
    doc.setFont('helvetica', 'normal');
    doc.text('Sincronizado y Auditado', 55, 62);

    // ─── Sección 1: KPIs ─────────────────────────────────────
    let currentY = 80;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('1. RESUMEN EJECUTIVO (INDICADORES CLAVE)', 15, currentY);

    currentY += 10;
    const kpis = [
        { label: 'Total de Bienes registrados', value: stats.totalAssets },
        { label: 'Bienes Disponibles', value: stats.assetsDisponible },
        { label: 'Bienes en Uso Operativo', value: stats.assetsEnUso },
        { label: 'Bienes Dados de Baja', value: stats.assetsBaja },
        { label: 'Movimientos Realizados', value: stats.totalMovements },
        { label: 'Mantenimientos en Sistema', value: stats.totalMaintenances },
    ];

    // Dibujar "Tabla" manual
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(15, currentY, 195, currentY); // Borde superior

    kpis.forEach((kpi, idx) => {
        currentY += 8;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(9);
        doc.text(kpi.label, 20, currentY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(kpi.value.toString(), 150, currentY, { align: 'right' });

        currentY += 2;
        doc.line(15, currentY, 195, currentY);
    });

    // ─── Sección 2: Distribución ─────────────────────────────
    currentY += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('2. DISTRIBUCIÓN POR CATEGORÍA', 15, currentY);

    currentY += 10;
    doc.line(15, currentY, 195, currentY);

    const categories = Object.entries(stats.assetsByCategory || {}).sort((a, b) => b[1] - a[1]).slice(0, 15);

    if (categories.length === 0) {
        currentY += 10;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('No hay datos de categorías disponibles.', 20, currentY);
    } else {
        categories.forEach(([name, count]) => {
            currentY += 8;
            if (currentY > 270) { // Salto de página básico
                doc.addPage();
                currentY = 20;
            }
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(8);
            doc.text(name.toUpperCase(), 20, currentY);
            doc.text(count.toString(), 150, currentY, { align: 'right' });

            currentY += 2;
            doc.line(15, currentY, 195, currentY);
        });
    }

    // ─── Footer ──────────────────────────────────────────────
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('Generado por el Módulo de Reportes SIPREB - San Luis de Cañete', 105, pageHeight - 10, { align: 'center' });

    // ─── Descarga ─────────────────────────────────────────────
    doc.save(`SIPREB_REPORTE_GERENCIAL_${new Date().getTime()}.pdf`);
}
