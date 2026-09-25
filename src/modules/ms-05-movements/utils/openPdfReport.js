const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const sanitizePdfFileName = (title) => {
  const displayTitle = String(title || 'Reporte').trim() || 'Reporte';
  const fileName = displayTitle.endsWith('.pdf') ? displayTitle : `${displayTitle}.pdf`;
  return fileName.replace(/[<>:"/\\|?*]/g, '-');
};

/**
 * Abre PDF en pestaña nueva con título legible.
 * La URL del blob permanece activa hasta cerrar la pestaña (evita error al descargar).
 */
export const openPdfInBrowser = (blob, title) => {
  if (!blob) return;

  const fileName = sanitizePdfFileName(title);
  const displayTitle = fileName.replace(/\.pdf$/i, '');
  const file = new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() });
  const url = URL.createObjectURL(file);

  const win = window.open('', '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }

  const safeTitle = escapeHtml(displayTitle);
  const safeFileName = escapeHtml(fileName);
  const safeUrl = escapeHtml(url);

  win.document.write(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <style>
    html, body { margin: 0; height: 100%; background: #525659; font-family: "Segoe UI", system-ui, sans-serif; }
    .bar {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      height: 40px; padding: 0 12px; background: #323639; color: #f1f1f1; border-bottom: 1px solid #202124;
    }
    .bar-title { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar a {
      color: #f1f1f1; background: #3c4043; border: 1px solid #5f6368; border-radius: 4px;
      padding: 5px 10px; font-size: 12px; text-decoration: none; white-space: nowrap;
    }
    .bar a:hover { background: #4a4d51; }
    iframe { width: 100%; height: calc(100vh - 40px); border: none; display: block; }
  </style>
</head>
<body>
  <div class="bar">
    <span class="bar-title">${safeTitle}</span>
    <a href="${safeUrl}" download="${safeFileName}">Descargar PDF</a>
  </div>
  <iframe src="${safeUrl}#toolbar=0" title="${safeTitle}"></iframe>
  <script>
    window.addEventListener('beforeunload', function () {
      try { URL.revokeObjectURL(${JSON.stringify(url)}); } catch (e) {}
    });
  </script>
</body>
</html>`
  );
  win.document.close();

  const cleanup = setInterval(() => {
    if (win.closed) {
      URL.revokeObjectURL(url);
      clearInterval(cleanup);
    }
  }, 500);
};
